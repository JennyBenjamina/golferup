import { z } from "zod";
import { eq, and, desc, lt, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../init";
import { offers, listings, users } from "@/server/db/schema";

/**
 * Expire any accepted offers whose payment deadline has passed.
 * Marks them as "expired" and relists the associated listings.
 */
export async function expireOverdueOffers(db: any) {
  const now = new Date();

  // Find all accepted offers past their payment deadline
  const expired = await db
    .select({ id: offers.id, listingId: offers.listingId })
    .from(offers)
    .where(
      and(
        eq(offers.status, "accepted"),
        lt(offers.paymentDeadline, now)
      )
    );

  for (const row of expired) {
    // Mark offer as expired
    await db
      .update(offers)
      .set({ status: "expired" })
      .where(eq(offers.id, row.id));

    // Relist the item
    await db
      .update(listings)
      .set({ status: "active" })
      .where(eq(listings.id, row.listingId));
  }

  return expired.length;
}

export const offersRouter = router({
  // Submit an offer on a listing
  create: protectedProcedure
    .input(
      z.object({
        listingId: z.string().uuid(),
        amount: z.string().regex(/^\d+(\.\d{1,2})?$/),
        message: z.string().max(500).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify listing exists and is active
      const [listing] = await ctx.db
        .select()
        .from(listings)
        .where(eq(listings.id, input.listingId))
        .limit(1);

      if (!listing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Listing not found." });
      }
      if (listing.status !== "active") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "This listing is no longer available." });
      }
      if (listing.sellerId === ctx.userId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "You can't make an offer on your own listing." });
      }

      const [offer] = await ctx.db
        .insert(offers)
        .values({
          listingId: input.listingId,
          buyerId: ctx.userId,
          amount: input.amount,
          message: input.message,
        })
        .returning();

      return offer;
    }),

  // Accept an offer (seller only)
  accept: protectedProcedure
    .input(
      z.object({
        offerId: z.string().uuid(),
        deadlineHours: z.number().min(1).max(168).default(24), // 1h to 7 days, default 24h
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [offer] = await ctx.db
        .select({
          offer: offers,
          sellerId: listings.sellerId,
        })
        .from(offers)
        .innerJoin(listings, eq(offers.listingId, listings.id))
        .where(eq(offers.id, input.offerId))
        .limit(1);

      if (!offer) throw new TRPCError({ code: "NOT_FOUND" });
      if (offer.sellerId !== ctx.userId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only the seller can accept offers." });
      }
      if (offer.offer.status !== "pending") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "This offer is no longer pending." });
      }

      // Set payment deadline
      const paymentDeadline = new Date(
        Date.now() + input.deadlineHours * 60 * 60 * 1000
      );

      // Accept this offer with a payment deadline
      const [updated] = await ctx.db
        .update(offers)
        .set({ status: "accepted", paymentDeadline })
        .where(eq(offers.id, input.offerId))
        .returning();

      // Reserve the listing so no one else can buy it
      await ctx.db
        .update(listings)
        .set({ status: "reserved" })
        .where(eq(listings.id, offer.offer.listingId));

      // Decline all other pending offers on this listing
      await ctx.db
        .update(offers)
        .set({ status: "declined" })
        .where(
          and(
            eq(offers.listingId, offer.offer.listingId),
            eq(offers.status, "pending")
          )
        );

      return updated;
    }),

  // Decline an offer (seller only)
  decline: protectedProcedure
    .input(z.object({ offerId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [offer] = await ctx.db
        .select({
          offer: offers,
          sellerId: listings.sellerId,
        })
        .from(offers)
        .innerJoin(listings, eq(offers.listingId, listings.id))
        .where(eq(offers.id, input.offerId))
        .limit(1);

      if (!offer) throw new TRPCError({ code: "NOT_FOUND" });
      if (offer.sellerId !== ctx.userId) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const [updated] = await ctx.db
        .update(offers)
        .set({ status: "declined" })
        .where(eq(offers.id, input.offerId))
        .returning();

      return updated;
    }),

  // Counter an offer (seller only)
  counter: protectedProcedure
    .input(
      z.object({
        offerId: z.string().uuid(),
        amount: z.string().regex(/^\d+(\.\d{1,2})?$/),
        message: z.string().max(500).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [offer] = await ctx.db
        .select({
          offer: offers,
          sellerId: listings.sellerId,
        })
        .from(offers)
        .innerJoin(listings, eq(offers.listingId, listings.id))
        .where(eq(offers.id, input.offerId))
        .limit(1);

      if (!offer) throw new TRPCError({ code: "NOT_FOUND" });
      if (offer.sellerId !== ctx.userId) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      // Mark original as countered
      await ctx.db
        .update(offers)
        .set({ status: "countered" })
        .where(eq(offers.id, input.offerId));

      // Create a new counter-offer (from seller to buyer)
      const [counter] = await ctx.db
        .insert(offers)
        .values({
          listingId: offer.offer.listingId,
          buyerId: offer.offer.buyerId, // original buyer
          amount: input.amount,
          message: input.message ?? `Counter offer: $${input.amount}`,
        })
        .returning();

      return counter;
    }),

  // Get offers on a listing (seller sees all, buyer sees their own)
  byListing: protectedProcedure
    .input(z.object({ listingId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      // Inline expiration sweep for this listing
      await expireOverdueOffers(ctx.db);

      // Check if user is the seller
      const [listing] = await ctx.db
        .select({ sellerId: listings.sellerId })
        .from(listings)
        .where(eq(listings.id, input.listingId))
        .limit(1);

      const isSeller = listing?.sellerId === ctx.userId;

      const conditions = [eq(offers.listingId, input.listingId)];
      if (!isSeller) {
        conditions.push(eq(offers.buyerId, ctx.userId));
      }

      return ctx.db
        .select({
          offer: offers,
          buyer: {
            id: users.id,
            name: users.name,
            image: users.image,
            ratingAvg: users.ratingAvg,
          },
        })
        .from(offers)
        .innerJoin(users, eq(offers.buyerId, users.id))
        .where(and(...conditions))
        .orderBy(desc(offers.createdAt));
    }),

  // Get all offers the current user has made
  myOffers: protectedProcedure.query(async ({ ctx }) => {
    // Inline expiration sweep
    await expireOverdueOffers(ctx.db);

    return ctx.db
      .select({
        offer: offers,
        listing: {
          id: listings.id,
          title: listings.title,
          price: listings.price,
          images: listings.images,
          status: listings.status,
        },
      })
      .from(offers)
      .innerJoin(listings, eq(offers.listingId, listings.id))
      .where(eq(offers.buyerId, ctx.userId))
      .orderBy(desc(offers.createdAt));
  }),

  // Get all offers received on the current user's listings
  receivedOffers: protectedProcedure.query(async ({ ctx }) => {
    // Inline expiration sweep
    await expireOverdueOffers(ctx.db);

    return ctx.db
      .select({
        offer: offers,
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
          ratingAvg: users.ratingAvg,
        },
      })
      .from(offers)
      .innerJoin(listings, eq(offers.listingId, listings.id))
      .innerJoin(users, eq(offers.buyerId, users.id))
      .where(eq(listings.sellerId, ctx.userId))
      .orderBy(desc(offers.createdAt));
  }),
});
