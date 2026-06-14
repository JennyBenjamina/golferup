import { z } from "zod";
import { eq, desc, and, sql, inArray } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure, protectedProcedure } from "../init";
import { posts, postUpvotes, users, comments } from "@/server/db/schema";

export const postsRouter = router({
  // Paginated feed with category filtering and sort
  feed: publicProcedure
    .input(
      z.object({
        category: z
          .enum([
            "gear_talk",
            "course_reviews",
            "swing_tips",
            "deals",
            "general",
          ])
          .optional(),
        sort: z.enum(["newest", "trending", "top"]).default("newest"),
        cursor: z.string().uuid().optional(),
        limit: z.number().min(1).max(50).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const conditions = [];
      if (input.category) {
        conditions.push(eq(posts.category, input.category));
      }

      // For cursor-based pagination, get the cursor post's createdAt
      if (input.cursor) {
        const [cursorPost] = await ctx.db
          .select({ createdAt: posts.createdAt })
          .from(posts)
          .where(eq(posts.id, input.cursor))
          .limit(1);

        if (cursorPost) {
          conditions.push(
            sql`${posts.createdAt} < ${cursorPost.createdAt}`
          );
        }
      }

      // Determine sort order
      let orderBy;
      switch (input.sort) {
        case "top":
          orderBy = desc(posts.upvoteCount);
          break;
        case "trending":
          // Trending = upvotes weighted by recency (simple: upvotes / age_in_hours)
          orderBy = sql`(${posts.upvoteCount} + 1.0) / GREATEST(EXTRACT(EPOCH FROM (NOW() - ${posts.createdAt})) / 3600, 1) DESC`;
          break;
        case "newest":
        default:
          orderBy = desc(posts.createdAt);
          break;
      }

      const items = await ctx.db
        .select({
          post: posts,
          author: {
            id: users.id,
            name: users.name,
            nickname: users.nickname,
            image: users.image,
            ratingAvg: users.ratingAvg,
          },
        })
        .from(posts)
        .innerJoin(users, eq(posts.authorId, users.id))
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(orderBy)
        .limit(input.limit + 1);

      let nextCursor: string | undefined;
      if (items.length > input.limit) {
        const next = items.pop()!;
        nextCursor = next.post.id;
      }

      // If logged in, check which posts the user has upvoted
      let upvotedPostIds: string[] = [];
      if (ctx.userId && items.length > 0) {
        const postIds = items.map((i) => i.post.id);
        const upvoted = await ctx.db
          .select({ postId: postUpvotes.postId })
          .from(postUpvotes)
          .where(
            and(
              eq(postUpvotes.userId, ctx.userId),
              inArray(postUpvotes.postId, postIds)
            )
          );
        upvotedPostIds = upvoted.map((u) => u.postId);
      }

      return {
        items: items.map((i) => ({
          ...i,
          hasUpvoted: upvotedPostIds.includes(i.post.id),
        })),
        nextCursor,
      };
    }),

  // Get single post by ID
  getById: publicProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [result] = await ctx.db
        .select({
          post: posts,
          author: {
            id: users.id,
            name: users.name,
            nickname: users.nickname,
            image: users.image,
            ratingAvg: users.ratingAvg,
            ratingCount: users.ratingCount,
          },
        })
        .from(posts)
        .innerJoin(users, eq(posts.authorId, users.id))
        .where(eq(posts.id, input.id))
        .limit(1);

      if (!result) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Post not found" });
      }

      // Check if current user has upvoted
      let hasUpvoted = false;
      if (ctx.userId) {
        const [upvote] = await ctx.db
          .select({ postId: postUpvotes.postId })
          .from(postUpvotes)
          .where(
            and(
              eq(postUpvotes.userId, ctx.userId),
              eq(postUpvotes.postId, input.id)
            )
          )
          .limit(1);
        hasUpvoted = !!upvote;
      }

      return { ...result, hasUpvoted };
    }),

  // Create a new post
  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(3).max(255),
        body: z.string().min(1).max(10000),
        category: z
          .enum([
            "gear_talk",
            "course_reviews",
            "swing_tips",
            "deals",
            "general",
          ])
          .default("general"),
        images: z.array(z.string().url()).max(4).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [post] = await ctx.db
        .insert(posts)
        .values({
          authorId: ctx.userId,
          title: input.title,
          body: input.body,
          category: input.category,
          images: input.images ?? [],
        })
        .returning();

      return post;
    }),

  // Update own post
  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        title: z.string().min(3).max(255).optional(),
        body: z.string().min(1).max(10000).optional(),
        category: z
          .enum([
            "gear_talk",
            "course_reviews",
            "swing_tips",
            "deals",
            "general",
          ])
          .optional(),
        images: z.array(z.string().url()).max(4).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [existing] = await ctx.db
        .select({ authorId: posts.authorId })
        .from(posts)
        .where(eq(posts.id, input.id))
        .limit(1);

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      if (existing.authorId !== ctx.userId) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const { id, ...updates } = input;
      const [updated] = await ctx.db
        .update(posts)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(posts.id, id))
        .returning();

      return updated;
    }),

  // Delete own post
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [existing] = await ctx.db
        .select({ authorId: posts.authorId })
        .from(posts)
        .where(eq(posts.id, input.id))
        .limit(1);

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      if (existing.authorId !== ctx.userId) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      await ctx.db.delete(posts).where(eq(posts.id, input.id));
      return { success: true };
    }),

  // Toggle upvote on a post
  toggleUpvote: protectedProcedure
    .input(z.object({ postId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Check if already upvoted
      const [existing] = await ctx.db
        .select()
        .from(postUpvotes)
        .where(
          and(
            eq(postUpvotes.userId, ctx.userId),
            eq(postUpvotes.postId, input.postId)
          )
        )
        .limit(1);

      if (existing) {
        // Remove upvote
        await ctx.db
          .delete(postUpvotes)
          .where(
            and(
              eq(postUpvotes.userId, ctx.userId),
              eq(postUpvotes.postId, input.postId)
            )
          );
        await ctx.db
          .update(posts)
          .set({
            upvoteCount: sql`GREATEST(${posts.upvoteCount} - 1, 0)`,
          })
          .where(eq(posts.id, input.postId));

        return { upvoted: false };
      } else {
        // Add upvote
        await ctx.db.insert(postUpvotes).values({
          userId: ctx.userId,
          postId: input.postId,
        });
        await ctx.db
          .update(posts)
          .set({
            upvoteCount: sql`${posts.upvoteCount} + 1`,
          })
          .where(eq(posts.id, input.postId));

        return { upvoted: true };
      }
    }),

  // Get posts by a specific user
  byUser: publicProcedure
    .input(
      z.object({
        userId: z.string().uuid(),
        limit: z.number().min(1).max(50).default(20),
        cursor: z.string().uuid().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const conditions = [eq(posts.authorId, input.userId)];

      if (input.cursor) {
        const [cursorPost] = await ctx.db
          .select({ createdAt: posts.createdAt })
          .from(posts)
          .where(eq(posts.id, input.cursor))
          .limit(1);

        if (cursorPost) {
          conditions.push(
            sql`${posts.createdAt} < ${cursorPost.createdAt}`
          );
        }
      }

      const items = await ctx.db
        .select({
          post: posts,
          author: {
            id: users.id,
            name: users.name,
            nickname: users.nickname,
            image: users.image,
          },
        })
        .from(posts)
        .innerJoin(users, eq(posts.authorId, users.id))
        .where(and(...conditions))
        .orderBy(desc(posts.createdAt))
        .limit(input.limit + 1);

      let nextCursor: string | undefined;
      if (items.length > input.limit) {
        const next = items.pop()!;
        nextCursor = next.post.id;
      }

      return { items, nextCursor };
    }),
});
