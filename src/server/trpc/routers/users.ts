import { z } from "zod";
import { eq } from "drizzle-orm";
import { router, publicProcedure, protectedProcedure } from "../init";
import { users } from "@/server/db/schema";

export const usersRouter = router({
  // Get a user's public profile
  getProfile: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [user] = await ctx.db
        .select({
          id: users.id,
          name: users.name,
          nickname: users.nickname,
          image: users.image,
          bio: users.bio,
          locationCity: users.locationCity,
          locationState: users.locationState,
          ratingAvg: users.ratingAvg,
          ratingCount: users.ratingCount,
          createdAt: users.createdAt,
        })
        .from(users)
        .where(eq(users.id, input.id))
        .limit(1);

      return user ?? null;
    }),

  // Get current user's full profile (private)
  me: protectedProcedure.query(async ({ ctx }) => {
    const [user] = await ctx.db
      .select()
      .from(users)
      .where(eq(users.id, ctx.userId))
      .limit(1);

    return user ?? null;
  }),

  // Update current user's profile
  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255).optional(),
        nickname: z.string().max(50).optional(),
        bio: z.string().max(500).optional(),
        image: z.string().url().optional(),
        locationCity: z.string().max(255).optional(),
        locationState: z.string().max(100).optional(),
        locationLat: z.number().optional(),
        locationLng: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.db
        .update(users)
        .set({
          ...input,
          updatedAt: new Date(),
        })
        .where(eq(users.id, ctx.userId))
        .returning();

      return updated;
    }),
});
