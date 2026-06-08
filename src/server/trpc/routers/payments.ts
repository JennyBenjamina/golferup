import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../init";
import { users, listings, transactions, offers } from "@/server/db/schema";
import {
  createConnectAccount,
  createOnboardingLink,
  checkAccountStatus,
  createDashboardLink,
  createPaymentIntent,
  capturePayment,
  cancelPayment,
  retrievePaymentIntent,
  createAccountSession,
  PLATFORM_FEE_PERCENT,
} from "@/server/services/stripe";

export const paymentsRouter = router({
  // ─── Seller Onboarding ──────────────────────────────────────────────────────

  // Start Stripe Connect onboarding
  onboardSeller: protectedProcedure.mutation(async ({ ctx }) => {
    const [user] = await ctx.db
      .select()
      .from(users)
      .where(eq(users.id, ctx.userId))
      .limit(1);

    if (!user) throw new TRPCError({ code: "NOT_FOUND" });

    let stripeAccountId: string = user.stripeAccountId ?? "";

    // Verify existing account still exists on Stripe, or create a new one
    if (stripeAccountId) {
      try {
        await checkAccountStatus(stripeAccountId);
      } catch (err: any) {
        // Account was deleted from Stripe — clear and recreate
        if (err?.statusCode === 404 || err?.code === "account_invalid" || err?.message?.includes("No such account")) {
          stripeAccountId = "";
          await ctx.db
            .update(users)
            .set({ stripeAccountId: null, stripeOnboarded: false })
            .where(eq(users.id, ctx.userId));
        } else {
          throw err;
        }
      }
    }

    if (!stripeAccountId) {
      const account = await createConnectAccount({
        email: user.email,
        userId: user.id,
      });
      stripeAccountId = account.id;

      await ctx.db
        .update(users)
        .set({ stripeAccountId })
        .where(eq(users.id, ctx.userId));
    }

    // Generate onboarding link
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXTAUTH_URL ||
      (process.env.VERCEL_PROJECT_PRODUCTION_URL
        ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
        : "http://localhost:3000");
    const link = await createOnboardingLink({
      stripeAccountId,
      returnUrl: `${baseUrl}/settings?stripe=complete`,
      refreshUrl: `${baseUrl}/settings?stripe=refresh`,
    });

    return { url: link.url };
  }),

  // Create an Account Session for embedded onboarding components
  createAccountSession: protectedProcedure.mutation(async ({ ctx }) => {
    const [user] = await ctx.db
      .select()
      .from(users)
      .where(eq(users.id, ctx.userId))
      .limit(1);

    if (!user) throw new TRPCError({ code: "NOT_FOUND" });

    let stripeAccountId: string = user.stripeAccountId ?? "";

    // Create Connect account if they don't have one
    if (!stripeAccountId) {
      const account = await createConnectAccount({
        email: user.email,
        userId: user.id,
      });
      stripeAccountId = account.id;

      await ctx.db
        .update(users)
        .set({ stripeAccountId })
        .where(eq(users.id, ctx.userId));
    }

    // Create an account session for the embedded component
    const accountSession = await createAccountSession(stripeAccountId);

    return {
      clientSecret: accountSession.client_secret,
    };
  }),

  // Check current seller onboarding status
  sellerStatus: protectedProcedure.query(async ({ ctx }) => {
    const [user] = await ctx.db
      .select({
        stripeAccountId: users.stripeAccountId,
        stripeOnboarded: users.stripeOnboarded,
      })
      .from(users)
      .where(eq(users.id, ctx.userId))
      .limit(1);

    if (!user?.stripeAccountId) {
      return { status: "not_started" as const };
    }

    let accountStatus;
    try {
      accountStatus = await checkAccountStatus(user.stripeAccountId);
    } catch (err: any) {
      // Account was deleted from Stripe — clear stale data and reset
      if (err?.statusCode === 404 || err?.code === "account_invalid" || err?.message?.includes("No such account")) {
        await ctx.db
          .update(users)
          .set({ stripeAccountId: null, stripeOnboarded: false })
          .where(eq(users.id, ctx.userId));
        return { status: "not_started" as const };
      }
      throw err;
    }

    // Update onboarded status if newly completed
    const isFullyOnboarded =
      accountStatus.chargesEnabled && accountStatus.detailsSubmitted;

    if (isFullyOnboarded && !user.stripeOnboarded) {
      await ctx.db
        .update(users)
        .set({ stripeOnboarded: true })
        .where(eq(users.id, ctx.userId));
    }

    // Only show "active" when our DB flag confirms onboarding is complete
    const onboarded = isFullyOnboarded || user.stripeOnboarded;

    return {
      status: onboarded ? ("active" as const) : ("pending" as const),
      chargesEnabled: accountStatus.chargesEnabled,
      payoutsEnabled: accountStatus.payoutsEnabled,
      detailsSubmitted: accountStatus.detailsSubmitted,
    };
  }),

  // Get Stripe Express dashboard link for seller
  dashboardLink: protectedProcedure.mutation(async ({ ctx }) => {
    const [user] = await ctx.db
      .select({ stripeAccountId: users.stripeAccountId })
      .from(users)
      .where(eq(users.id, ctx.userId))
      .limit(1);

    if (!user?.stripeAccountId) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message: "You haven't set up seller payments yet.",
      });
    }

    const link = await createDashboardLink(user.stripeAccountId);
    return { url: link.url };
  }),

  // ─── Checkout Flow ──────────────────────────────────────────────────────────

  // Create a payment intent for buying a listing (or accepting an offer)
  createCheckout: protectedProcedure
    .input(
      z.object({
        listingId: z.string().uuid(),
        offerId: z.string().uuid().optional(), // if paying via an accepted offer
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Fetch listing with seller info
      const [result] = await ctx.db
        .select({
          listing: listings,
          sellerStripeAccountId: users.stripeAccountId,
          sellerStripeOnboarded: users.stripeOnboarded,
        })
        .from(listings)
        .innerJoin(users, eq(listings.sellerId, users.id))
        .where(eq(listings.id, input.listingId))
        .limit(1);

      if (!result) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Listing not found." });
      }

      if (result.listing.sellerId === ctx.userId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "You can't buy your own listing." });
      }

      // Allow purchase if listing is active, or reserved (from an accepted offer)
      if (result.listing.status !== "active" && result.listing.status !== "reserved") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "This listing is no longer available." });
      }

      if (!result.sellerStripeAccountId || !result.sellerStripeOnboarded) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "The seller hasn't set up payments yet.",
        });
      }

      // Determine the price (from offer or listing price)
      let amount = parseFloat(result.listing.price);
      if (input.offerId) {
        const [offer] = await ctx.db
          .select()
          .from(offers)
          .where(
            and(
              eq(offers.id, input.offerId),
              eq(offers.status, "accepted")
            )
          )
          .limit(1);

        if (offer) {
          amount = parseFloat(offer.amount);
        }
      }

      // Create the payment intent
      const paymentIntent = await createPaymentIntent({
        amount,
        sellerStripeAccountId: result.sellerStripeAccountId,
        listingId: input.listingId,
        buyerId: ctx.userId,
        sellerId: result.listing.sellerId,
      });

      // Reserve the listing
      await ctx.db
        .update(listings)
        .set({ status: "reserved" })
        .where(eq(listings.id, input.listingId));

      // Create a pending transaction record
      const platformFee = amount * (PLATFORM_FEE_PERCENT / 100);
      const [transaction] = await ctx.db
        .insert(transactions)
        .values({
          listingId: input.listingId,
          buyerId: ctx.userId,
          sellerId: result.listing.sellerId,
          amount: amount.toFixed(2),
          platformFee: platformFee.toFixed(2),
          stripePaymentIntentId: paymentIntent.id,
          status: "pending",
        })
        .returning();

      return {
        clientSecret: paymentIntent.client_secret,
        transactionId: transaction?.id,
        amount,
        platformFee,
      };
    }),

  // Get checkout details (clientSecret + transaction info) for the frontend
  getCheckoutDetails: protectedProcedure
    .input(z.object({ transactionId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [result] = await ctx.db
        .select({
          transaction: transactions,
          listing: {
            id: listings.id,
            title: listings.title,
            price: listings.price,
            images: listings.images,
          },
        })
        .from(transactions)
        .innerJoin(listings, eq(transactions.listingId, listings.id))
        .where(eq(transactions.id, input.transactionId))
        .limit(1);

      if (!result) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Transaction not found." });
      }
      if (result.transaction.buyerId !== ctx.userId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "This is not your transaction." });
      }
      if (result.transaction.status !== "pending") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "This transaction is no longer pending." });
      }

      // Retrieve the payment intent to get the client_secret
      if (!result.transaction.stripePaymentIntentId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No payment intent found." });
      }

      const paymentIntent = await retrievePaymentIntent(
        result.transaction.stripePaymentIntentId
      );

      return {
        clientSecret: paymentIntent.client_secret as string,
        amount: result.transaction.amount,
        platformFee: result.transaction.platformFee,
        listing: result.listing,
      };
    }),

  // Confirm/capture a payment after buyer completes card entry
  confirmPayment: protectedProcedure
    .input(z.object({ transactionId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [transaction] = await ctx.db
        .select()
        .from(transactions)
        .where(eq(transactions.id, input.transactionId))
        .limit(1);

      if (!transaction) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      if (transaction.buyerId !== ctx.userId) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      if (!transaction.stripePaymentIntentId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No payment to confirm." });
      }

      // Capture the held funds
      await capturePayment(transaction.stripePaymentIntentId);

      // Mark transaction as completed
      await ctx.db
        .update(transactions)
        .set({ status: "completed" })
        .where(eq(transactions.id, input.transactionId));

      // Mark listing as sold
      await ctx.db
        .update(listings)
        .set({ status: "sold" })
        .where(eq(listings.id, transaction.listingId));

      return { success: true };
    }),

  // Cancel a pending transaction
  cancelTransaction: protectedProcedure
    .input(z.object({ transactionId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [transaction] = await ctx.db
        .select()
        .from(transactions)
        .where(eq(transactions.id, input.transactionId))
        .limit(1);

      if (!transaction) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      if (
        transaction.buyerId !== ctx.userId &&
        transaction.sellerId !== ctx.userId
      ) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      if (transaction.stripePaymentIntentId) {
        await cancelPayment(transaction.stripePaymentIntentId);
      }

      // Revert listing to active
      await ctx.db
        .update(listings)
        .set({ status: "active" })
        .where(eq(listings.id, transaction.listingId));

      // Remove the transaction
      await ctx.db
        .update(transactions)
        .set({ status: "refunded" })
        .where(eq(transactions.id, input.transactionId));

      return { success: true };
    }),

  // Get the buyer's transaction history
  myPurchases: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db
      .select({
        transaction: transactions,
        listing: {
          id: listings.id,
          title: listings.title,
          price: listings.price,
          images: listings.images,
        },
        seller: {
          id: users.id,
          name: users.name,
          image: users.image,
        },
      })
      .from(transactions)
      .innerJoin(listings, eq(transactions.listingId, listings.id))
      .innerJoin(users, eq(transactions.sellerId, users.id))
      .where(eq(transactions.buyerId, ctx.userId))
      .orderBy(transactions.createdAt);
  }),

  // Get the seller's transaction history
  mySales: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db
      .select({
        transaction: transactions,
        listing: {
          id: listings.id,
          title: listings.title,
          price: listings.price,
          images: listings.images,
        },
        buyer: {
          id: users.id,
          name: users.name,
          image: users.image,
        },
      })
      .from(transactions)
      .innerJoin(listings, eq(transactions.listingId, listings.id))
      .innerJoin(users, eq(transactions.buyerId, users.id))
      .where(eq(transactions.sellerId, ctx.userId))
      .orderBy(transactions.createdAt);
  }),
});
