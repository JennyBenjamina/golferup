"use client";

import { formatPrice, timeAgo } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { MessageCircle } from "lucide-react";

interface Conversation {
  conversation: {
    id: string;
    lastMessageAt: Date | null;
  };
  otherUser: {
    id: string;
    name: string | null;
    image: string | null;
  } | null;
  listing: {
    id: string;
    title: string;
    images: string[] | null;
    price: string;
  } | null;
  lastMessage: {
    body: string;
    senderId: string;
    createdAt: Date;
  } | null;
  unreadCount: number;
}

interface ConversationListProps {
  conversations: Conversation[];
  activeId: string | null;
  currentUserId: string;
  onSelect: (id: string) => void;
}

export function ConversationList({
  conversations,
  activeId,
  currentUserId,
  onSelect,
}: ConversationListProps) {
  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <MessageCircle className="w-10 h-10 text-gray-300 mb-3" />
        <p className="text-sm text-gray-500">No conversations yet</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100">
      {conversations.map(({ conversation, otherUser, listing, lastMessage, unreadCount }) => (
        <button
          key={conversation.id}
          onClick={() => onSelect(conversation.id)}
          className={cn(
            "w-full flex items-start gap-3 p-4 text-left hover:bg-gray-50 transition-colors",
            activeId === conversation.id && "bg-emerald-50 hover:bg-emerald-50"
          )}
        >
          {/* Avatar */}
          {otherUser?.image ? (
            <img
              src={otherUser.image}
              alt=""
              className="w-12 h-12 rounded-full shrink-0"
            />
          ) : (
            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
              <span className="text-emerald-700 font-semibold">
                {(otherUser?.nickname ?? otherUser?.name)?.charAt(0) ?? "?"}
              </span>
            </div>
          )}

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <p className={cn(
                "text-sm truncate",
                unreadCount > 0 ? "font-semibold text-gray-900" : "font-medium text-gray-700"
              )}>
                {otherUser?.nickname ?? otherUser?.name ?? "Unknown User"}
              </p>
              {lastMessage && (
                <span className="text-xs text-gray-400 shrink-0">
                  {timeAgo(lastMessage.createdAt)}
                </span>
              )}
            </div>

            {listing && (
              <p className="text-xs text-emerald-600 truncate">
                {listing.title} · {formatPrice(listing.price)}
              </p>
            )}

            {lastMessage && (
              <p className={cn(
                "text-sm truncate mt-0.5",
                unreadCount > 0 ? "text-gray-900" : "text-gray-500"
              )}>
                {lastMessage.senderId === currentUserId && (
                  <span className="text-gray-400">You: </span>
                )}
                {lastMessage.body}
              </p>
            )}
          </div>

          {/* Unread badge */}
          {unreadCount > 0 && (
            <span className="bg-emerald-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-1">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
