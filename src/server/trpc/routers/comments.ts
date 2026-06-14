import { z } from "zod";
import { eq, desc, and, sql, isNull } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure, protectedProcedure } from "../init";
import { comments, posts, users } from "@/server/db/schema";

export const commentsRouter = router({
  // Get comments for a post (threaded)
  byPost: publicProcedure
    .input(z.object({ postId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const allComments = await ctx.db
        .select({
          comment: comments,
          author: {
            id: users.id,
            name: users.name,
            nickname: users.nickname,
            image: users.image,
          },
        })
        .from(comments)
        .innerJoin(users, eq(comments.authorId, users.id))
        .where(eq(comments.postId, input.postId))
        .orderBy(desc(comments.createdAt));

      // Build a threaded tree
      type CommentWithReplies = {
        comment: typeof allComments[number]["comment"];
        author: typeof allComments[number]["author"];
        replies: CommentWithReplies[];
      };

      const commentMap = new Map<string, CommentWithReplies>();
      const topLevel: CommentWithReplies[] = [];

      // First pass: create all nodes
      for (const c of allComments) {
        commentMap.set(c.comment.id, { ...c, replies: [] });
      }

      // Second pass: build tree
      for (const c of allComments) {
        const node = commentMap.get(c.comment.id)!;
        if (c.comment.parentId && commentMap.has(c.comment.parentId)) {
          commentMap.get(c.comment.parentId)!.replies.push(node);
        } else {
          topLevel.push(node);
        }
      }

      // Sort top-level by oldest first, replies by oldest first
      topLevel.sort(
        (a, b) =>
          new Date(a.comment.createdAt).getTime() -
          new Date(b.comment.createdAt).getTime()
      );

      return topLevel;
    }),

  // Create a comment (optionally threaded via parentId)
  create: protectedProcedure
    .input(
      z.object({
        postId: z.string().uuid(),
        body: z.string().min(1).max(5000),
        parentId: z.string().uuid().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify post exists
      const [post] = await ctx.db
        .select({ id: posts.id })
        .from(posts)
        .where(eq(posts.id, input.postId))
        .limit(1);

      if (!post) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Post not found" });
      }

      // If replying, verify parent comment exists
      if (input.parentId) {
        const [parent] = await ctx.db
          .select({ id: comments.id })
          .from(comments)
          .where(eq(comments.id, input.parentId))
          .limit(1);

        if (!parent) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Parent comment not found",
          });
        }
      }

      const [comment] = await ctx.db
        .insert(comments)
        .values({
          postId: input.postId,
          authorId: ctx.userId,
          parentId: input.parentId,
          body: input.body,
        })
        .returning();

      // Increment comment count on the post
      await ctx.db
        .update(posts)
        .set({
          commentCount: sql`${posts.commentCount} + 1`,
        })
        .where(eq(posts.id, input.postId));

      return comment;
    }),

  // Delete own comment
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [existing] = await ctx.db
        .select({
          authorId: comments.authorId,
          postId: comments.postId,
        })
        .from(comments)
        .where(eq(comments.id, input.id))
        .limit(1);

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      if (existing.authorId !== ctx.userId) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      await ctx.db.delete(comments).where(eq(comments.id, input.id));

      // Decrement comment count
      await ctx.db
        .update(posts)
        .set({
          commentCount: sql`GREATEST(${posts.commentCount} - 1, 0)`,
        })
        .where(eq(posts.id, existing.postId));

      return { success: true };
    }),
});
