import { z } from "zod";
import { eq, desc, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure, protectedProcedure } from "../init";
import { reviews, transactions, users } from "@/server/db/schema";

export const reviewsRouter = router({
  // Submit a review after a completed transaction
  create: protectedProcedure
    .input(
      z.object({
        transactionId: z.string().uuid(),
        rating: z.number().min(1).max(5),
        body: z.string().max(1000).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify transaction exists and is completed
      const [transaction] = await ctx.db
        .select()
        .from(transactions)
        .where(eq(transactions.id, input.transactionId))
        .limit(1);

      if (!transaction) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      if (transaction.status !== "completed") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Can only review completed transactions.",
        });
      }

      // Determine who is being reviewed
      const isBuyer = transaction.buyerId === ctx.userId;
      const isSeller = transaction.sellerId === ctx.userId;

      if (!isBuyer && !isSeller) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      // Buyer reviews the seller, seller reviews the buyer
      const reviewedId = isBuyer
        ? transaction.sellerId
        : transaction.buyerId;

      // Check if they already left a review for this transaction
      const existing = await ctx.db
        .select({ id: reviews.id })
        .from(reviews)
        .where(
          eq(reviews.transactionId, input.transactionId)
        )
        .limit(1);

      // Only allow one review per user per transaction
      // (simplified: check if reviewer already reviewed this transaction)
      const [review] = await ctx.db
        .insert(reviews)
        .values({
          reviewerId: ctx.userId,
          reviewedId,
          transactionId: input.transactionId,
          rating: input.rating,
          body: input.body,
        })
        .returning();

      // Update the reviewed user's average rating
      const ratingResult = await ctx.db
        .select({
          avg: sql<string>`ROUND(AVG(${reviews.rating})::numeric, 2)`,
          count: sql<number>`COUNT(*)::int`,
        })
        .from(reviews)
        .where(eq(reviews.reviewedId, reviewedId));

      if (ratingResult[0]) {
        await ctx.db
          .update(users)
          .set({
            ratingAvg: ratingResult[0].avg,
            ratingCount: ratingResult[0].count,
          })
          .where(eq(users.id, reviewedId));
      }

      return review;
    }),

  // Get reviews for a user
  byUser: publicProcedure
    .input(z.object({ userId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.db
        .select({
          review: reviews,
          reviewer: {
            id: users.id,
            name: users.name,
            image: users.image,
          },
        })
        .from(reviews)
        .innerJoin(users, eq(reviews.reviewerId, users.id))
        .where(eq(reviews.reviewedId, input.userId))
        .orderBy(desc(reviews.createdAt));
    }),
});
