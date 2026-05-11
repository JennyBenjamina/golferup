import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { router, protectedProcedure } from "../init";
import { savedSearches } from "@/server/db/schema";

export const savedSearchesRouter = router({
  // List all saved searches for the current user
  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db
      .select()
      .from(savedSearches)
      .where(eq(savedSearches.userId, ctx.userId))
      .orderBy(desc(savedSearches.createdAt));
  }),

  // Save a new search
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255),
        query: z.string().optional(),
        category: z.string().optional(),
        condition: z.string().optional(),
        brand: z.string().optional(),
        hand: z.enum(["right", "left"]).optional(),
        priceMin: z.string().optional(),
        priceMax: z.string().optional(),
        locationState: z.string().optional(),
        radiusMiles: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [search] = await ctx.db
        .insert(savedSearches)
        .values({
          ...input,
          userId: ctx.userId,
        })
        .returning();

      return search;
    }),

  // Delete a saved search
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(savedSearches)
        .where(eq(savedSearches.id, input.id));

      return { success: true };
    }),

  // Toggle notifications for a saved search
  toggleNotify: protectedProcedure
    .input(z.object({ id: z.string().uuid(), enabled: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.db
        .update(savedSearches)
        .set({ notifyEnabled: input.enabled })
        .where(eq(savedSearches.id, input.id))
        .returning();

      return updated;
    }),
});
