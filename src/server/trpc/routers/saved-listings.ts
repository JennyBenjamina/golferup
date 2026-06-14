import { z } from "zod";
import { eq, and, desc, inArray } from "drizzle-orm";
import { router, protectedProcedure } from "../init";
import { savedListings, listings, users } from "@/server/db/schema";

export const savedListingsRouter = router({
  // Toggle save/unsave a listing
  toggle: protectedProcedure
    .input(z.object({ listingId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db
        .select()
        .from(savedListings)
        .where(
          and(
            eq(savedListings.userId, ctx.userId),
            eq(savedListings.listingId, input.listingId)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        // Unsave
        await ctx.db
          .delete(savedListings)
          .where(
            and(
              eq(savedListings.userId, ctx.userId),
              eq(savedListings.listingId, input.listingId)
            )
          );
        return { saved: false };
      } else {
        // Save
        await ctx.db.insert(savedListings).values({
          userId: ctx.userId,
          listingId: input.listingId,
        });
        return { saved: true };
      }
    }),

  // Check if specific listings are saved by the current user
  checkSaved: protectedProcedure
    .input(z.object({ listingIds: z.array(z.string().uuid()) }))
    .query(async ({ ctx, input }) => {
      if (input.listingIds.length === 0) return { savedIds: [] as string[] };

      const saved = await ctx.db
        .select({ listingId: savedListings.listingId })
        .from(savedListings)
        .where(
          and(
            eq(savedListings.userId, ctx.userId),
            inArray(savedListings.listingId, input.listingIds)
          )
        );

      return { savedIds: saved.map((s) => s.listingId) };
    }),

  // Get all saved listings for the current user
  list: protectedProcedure.query(async ({ ctx }) => {
    const results = await ctx.db
      .select({
        listing: {
          id: listings.id,
          title: listings.title,
          price: listings.price,
          condition: listings.condition,
          images: listings.images,
          locationCity: listings.locationCity,
          locationState: listings.locationState,
          createdAt: listings.createdAt,
          status: listings.status,
        },
        seller: {
          name: users.name,
          nickname: users.nickname,
          image: users.image,
        },
        savedAt: savedListings.createdAt,
      })
      .from(savedListings)
      .innerJoin(listings, eq(savedListings.listingId, listings.id))
      .innerJoin(users, eq(listings.sellerId, users.id))
      .where(eq(savedListings.userId, ctx.userId))
      .orderBy(desc(savedListings.createdAt));

    return results;
  }),
});
