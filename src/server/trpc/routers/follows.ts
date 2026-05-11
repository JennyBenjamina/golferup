import { z } from "zod";
import { eq, and, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure, protectedProcedure } from "../init";
import { follows, users } from "@/server/db/schema";

export const followsRouter = router({
  // Toggle follow/unfollow
  toggle: protectedProcedure
    .input(z.object({ userId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      if (input.userId === ctx.userId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You cannot follow yourself.",
        });
      }

      // Check if already following
      const [existing] = await ctx.db
        .select()
        .from(follows)
        .where(
          and(
            eq(follows.followerId, ctx.userId),
            eq(follows.followingId, input.userId)
          )
        )
        .limit(1);

      if (existing) {
        await ctx.db
          .delete(follows)
          .where(
            and(
              eq(follows.followerId, ctx.userId),
              eq(follows.followingId, input.userId)
            )
          );
        return { following: false };
      } else {
        await ctx.db.insert(follows).values({
          followerId: ctx.userId,
          followingId: input.userId,
        });
        return { following: true };
      }
    }),

  // Check if current user follows a given user
  isFollowing: publicProcedure
    .input(z.object({ userId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.userId) return { following: false };

      const [existing] = await ctx.db
        .select()
        .from(follows)
        .where(
          and(
            eq(follows.followerId, ctx.userId),
            eq(follows.followingId, input.userId)
          )
        )
        .limit(1);

      return { following: !!existing };
    }),

  // Get followers of a user
  followers: publicProcedure
    .input(z.object({ userId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const result = await ctx.db
        .select({
          id: users.id,
          name: users.name,
          image: users.image,
          ratingAvg: users.ratingAvg,
        })
        .from(follows)
        .innerJoin(users, eq(follows.followerId, users.id))
        .where(eq(follows.followingId, input.userId));

      return result;
    }),

  // Get users that a user is following
  following: publicProcedure
    .input(z.object({ userId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const result = await ctx.db
        .select({
          id: users.id,
          name: users.name,
          image: users.image,
          ratingAvg: users.ratingAvg,
        })
        .from(follows)
        .innerJoin(users, eq(follows.followingId, users.id))
        .where(eq(follows.followerId, input.userId));

      return result;
    }),

  // Get follower/following counts for a user
  counts: publicProcedure
    .input(z.object({ userId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [followerCount] = await ctx.db
        .select({ count: sql<number>`COUNT(*)::int` })
        .from(follows)
        .where(eq(follows.followingId, input.userId));

      const [followingCount] = await ctx.db
        .select({ count: sql<number>`COUNT(*)::int` })
        .from(follows)
        .where(eq(follows.followerId, input.userId));

      return {
        followers: followerCount?.count ?? 0,
        following: followingCount?.count ?? 0,
      };
    }),
});
