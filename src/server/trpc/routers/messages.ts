import { z } from "zod";
import { eq, and, or, desc, sql, isNull } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../init";
import { conversations, messages, users, listings } from "@/server/db/schema";

export const messagesRouter = router({
  // Start or get an existing conversation with another user (optionally about a listing)
  startConversation: protectedProcedure
    .input(
      z.object({
        recipientId: z.string().uuid(),
        listingId: z.string().uuid().optional(),
        initialMessage: z.string().min(1).max(2000).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (input.recipientId === ctx.userId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You can't message yourself.",
        });
      }

      // Check if a conversation already exists between these two users for this listing
      const existingConditions = [
        or(
          and(
            eq(conversations.participantOneId, ctx.userId),
            eq(conversations.participantTwoId, input.recipientId)
          ),
          and(
            eq(conversations.participantOneId, input.recipientId),
            eq(conversations.participantTwoId, ctx.userId)
          )
        ),
      ];

      if (input.listingId) {
        existingConditions.push(eq(conversations.listingId, input.listingId));
      } else {
        existingConditions.push(isNull(conversations.listingId));
      }

      const [existing] = await ctx.db
        .select()
        .from(conversations)
        .where(and(...existingConditions))
        .limit(1);

      if (existing) {
        // Send the initial message to the existing conversation
        if (input.initialMessage) {
          await ctx.db.insert(messages).values({
            conversationId: existing.id,
            senderId: ctx.userId,
            body: input.initialMessage,
          });
          await ctx.db
            .update(conversations)
            .set({ lastMessageAt: new Date() })
            .where(eq(conversations.id, existing.id));
        }
        return existing;
      }

      // Create new conversation
      const [conversation] = await ctx.db
        .insert(conversations)
        .values({
          participantOneId: ctx.userId,
          participantTwoId: input.recipientId,
          listingId: input.listingId,
        })
        .returning();

      // Send the initial message
      if (input.initialMessage && conversation) {
        await ctx.db.insert(messages).values({
          conversationId: conversation.id,
          senderId: ctx.userId,
          body: input.initialMessage,
        });
        await ctx.db
          .update(conversations)
          .set({ lastMessageAt: new Date() })
          .where(eq(conversations.id, conversation.id));
      }

      return conversation;
    }),

  // Get all conversations for the current user
  listConversations: protectedProcedure.query(async ({ ctx }) => {
    const allConversations = await ctx.db
      .select({
        conversation: conversations,
        listing: {
          id: listings.id,
          title: listings.title,
          images: listings.images,
          price: listings.price,
        },
      })
      .from(conversations)
      .leftJoin(listings, eq(conversations.listingId, listings.id))
      .where(
        or(
          eq(conversations.participantOneId, ctx.userId),
          eq(conversations.participantTwoId, ctx.userId)
        )
      )
      .orderBy(desc(conversations.lastMessageAt));

    // For each conversation, get the other participant and the last message
    const enriched = await Promise.all(
      allConversations.map(async ({ conversation, listing }) => {
        const otherUserId =
          conversation.participantOneId === ctx.userId
            ? conversation.participantTwoId
            : conversation.participantOneId;

        const [otherUser] = await ctx.db
          .select({
            id: users.id,
            name: users.name,
            nickname: users.nickname,
            image: users.image,
          })
          .from(users)
          .where(eq(users.id, otherUserId))
          .limit(1);

        const [lastMessage] = await ctx.db
          .select()
          .from(messages)
          .where(eq(messages.conversationId, conversation.id))
          .orderBy(desc(messages.createdAt))
          .limit(1);

        // Count unread messages
        const [unreadResult] = await ctx.db
          .select({ count: sql<number>`COUNT(*)::int` })
          .from(messages)
          .where(
            and(
              eq(messages.conversationId, conversation.id),
              sql`${messages.senderId} != ${ctx.userId}`,
              isNull(messages.readAt)
            )
          );

        return {
          conversation,
          otherUser: otherUser ?? null,
          listing: listing?.id ? listing : null,
          lastMessage: lastMessage ?? null,
          unreadCount: unreadResult?.count ?? 0,
        };
      })
    );

    return enriched;
  }),

  // Get messages for a conversation (paginated)
  getMessages: protectedProcedure
    .input(
      z.object({
        conversationId: z.string().uuid(),
        limit: z.number().min(1).max(100).default(50),
        cursor: z.string().uuid().optional(), // oldest message ID for pagination
      })
    )
    .query(async ({ ctx, input }) => {
      // Verify the user is a participant
      const [conversation] = await ctx.db
        .select()
        .from(conversations)
        .where(eq(conversations.id, input.conversationId))
        .limit(1);

      if (!conversation) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      if (
        conversation.participantOneId !== ctx.userId &&
        conversation.participantTwoId !== ctx.userId
      ) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const results = await ctx.db
        .select()
        .from(messages)
        .where(eq(messages.conversationId, input.conversationId))
        .orderBy(desc(messages.createdAt))
        .limit(input.limit + 1);

      let nextCursor: string | undefined;
      if (results.length > input.limit) {
        const next = results.pop();
        nextCursor = next?.id;
      }

      return {
        messages: results.reverse(), // Return oldest-first for display
        nextCursor,
      };
    }),

  // Send a message
  send: protectedProcedure
    .input(
      z.object({
        conversationId: z.string().uuid(),
        body: z.string().min(1).max(2000),
        imageUrl: z.string().url().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify the user is a participant
      const [conversation] = await ctx.db
        .select()
        .from(conversations)
        .where(eq(conversations.id, input.conversationId))
        .limit(1);

      if (!conversation) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      if (
        conversation.participantOneId !== ctx.userId &&
        conversation.participantTwoId !== ctx.userId
      ) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const [message] = await ctx.db
        .insert(messages)
        .values({
          conversationId: input.conversationId,
          senderId: ctx.userId,
          body: input.body,
          imageUrl: input.imageUrl,
        })
        .returning();

      // Update last message timestamp
      await ctx.db
        .update(conversations)
        .set({ lastMessageAt: new Date() })
        .where(eq(conversations.id, input.conversationId));

      return message;
    }),

  // Mark messages as read
  markRead: protectedProcedure
    .input(z.object({ conversationId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .update(messages)
        .set({ readAt: new Date() })
        .where(
          and(
            eq(messages.conversationId, input.conversationId),
            sql`${messages.senderId} != ${ctx.userId}`,
            isNull(messages.readAt)
          )
        );

      return { success: true };
    }),

  // Get total unread count across all conversations
  unreadCount: protectedProcedure.query(async ({ ctx }) => {
    // Get all conversation IDs for this user
    const userConversations = await ctx.db
      .select({ id: conversations.id })
      .from(conversations)
      .where(
        or(
          eq(conversations.participantOneId, ctx.userId),
          eq(conversations.participantTwoId, ctx.userId)
        )
      );

    if (userConversations.length === 0) return { count: 0 };

    const conversationIds = userConversations.map((c) => c.id);

    const [result] = await ctx.db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(messages)
      .where(
        and(
          sql`${messages.conversationId} IN (${sql.join(
            conversationIds.map((id) => sql`${id}`),
            sql`, `
          )})`,
          sql`${messages.senderId} != ${ctx.userId}`,
          isNull(messages.readAt)
        )
      );

    return { count: result?.count ?? 0 };
  }),
});
