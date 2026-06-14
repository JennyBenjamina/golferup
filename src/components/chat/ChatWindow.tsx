"use client";

import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { Send, ImagePlus, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface ChatWindowProps {
  conversationId: string;
  currentUserId: string;
  otherUser: {
    id: string;
    name: string | null;
    nickname: string | null;
    image: string | null;
  } | null;
  listing?: {
    id: string;
    title: string;
    images: string[] | null;
    price: string;
  } | null;
  onBack?: () => void;
}

export function ChatWindow({
  conversationId,
  currentUserId,
  otherUser,
  listing,
  onBack,
}: ChatWindowProps) {
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Prevent browser auto-focus on mount — the keyboard covers the conversation
  useEffect(() => {
    inputRef.current?.blur();
  }, [conversationId]);

  const utils = trpc.useUtils();

  const { data, isLoading } = trpc.messages.getMessages.useQuery(
    { conversationId, limit: 50 },
    { refetchInterval: 3000 } // Poll every 3s until Socket.io is wired up
  );

  const sendMessage = trpc.messages.send.useMutation({
    onSuccess: () => {
      setNewMessage("");
      utils.messages.getMessages.invalidate({ conversationId });
      utils.messages.listConversations.invalidate();
    },
  });

  const markRead = trpc.messages.markRead.useMutation();

  // Mark messages as read when viewing
  useEffect(() => {
    markRead.mutate({ conversationId });
  }, [conversationId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [data?.messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    sendMessage.mutate({
      conversationId,
      body: newMessage.trim(),
    });
  };

  const messageList = data?.messages ?? [];

  // Group messages by date
  const groupedMessages: { date: string; messages: typeof messageList }[] = [];
  let currentDate = "";
  for (const msg of messageList) {
    const dateStr = new Date(msg.createdAt).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    if (dateStr !== currentDate) {
      currentDate = dateStr;
      groupedMessages.push({ date: dateStr, messages: [] });
    }
    groupedMessages[groupedMessages.length - 1].messages.push(msg);
  }

  return (
    <div className="flex flex-col h-full">
      {/* Chat header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 bg-white shrink-0">
        {onBack && (
          <button
            onClick={onBack}
            className="p-1 hover:bg-gray-100 rounded-lg md:hidden"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
        )}
        <Link
          href={`/profile/${otherUser?.id}`}
          className="flex items-center gap-3 flex-1 min-w-0"
        >
          {otherUser?.image ? (
            <img
              src={otherUser.image}
              alt=""
              className="w-10 h-10 rounded-full"
            />
          ) : (
            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
              <span className="text-emerald-700 font-semibold text-sm">
                {(otherUser?.nickname ?? otherUser?.name)?.charAt(0) ?? "?"}
              </span>
            </div>
          )}
          <div className="min-w-0">
            <p className="font-medium text-gray-900 text-sm truncate">
              {otherUser?.nickname ?? otherUser?.name ?? "Unknown User"}
            </p>
            {listing && (
              <p className="text-xs text-gray-500 truncate">
                Re: {listing.title}
              </p>
            )}
          </div>
        </Link>
        {listing && (
          <Link
            href={`/listing/${listing.id}`}
            className="w-10 h-10 bg-gray-100 rounded-lg overflow-hidden shrink-0"
          >
            {listing.images?.[0] ? (
              <img
                src={listing.images[0]}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full" />
            )}
          </Link>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : messageList.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center">
            <p className="text-sm text-gray-500">
              No messages yet. Say hello!
            </p>
          </div>
        ) : (
          groupedMessages.map((group) => (
            <div key={group.date}>
              {/* Date separator */}
              <div className="flex items-center gap-3 my-4">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-xs text-gray-400">{group.date}</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>

              {/* Messages in this date group */}
              <div className="space-y-2">
                {group.messages.map((msg) => {
                  const isMine = msg.senderId === currentUserId;
                  return (
                    <div
                      key={msg.id}
                      className={cn(
                        "flex",
                        isMine ? "justify-end" : "justify-start"
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[75%] px-4 py-2.5 rounded-2xl text-sm",
                          isMine
                            ? "bg-emerald-600 text-white rounded-br-md"
                            : "bg-gray-100 text-gray-900 rounded-bl-md"
                        )}
                      >
                        <p className="whitespace-pre-wrap break-words">
                          {msg.body}
                        </p>
                        {msg.imageUrl && (
                          <img
                            src={msg.imageUrl}
                            alt=""
                            className="mt-2 rounded-lg max-w-full"
                          />
                        )}
                        <p
                          className={cn(
                            "text-xs mt-1",
                            isMine ? "text-emerald-200" : "text-gray-400"
                          )}
                        >
                          {new Date(msg.createdAt).toLocaleTimeString("en-US", {
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                          {isMine && msg.readAt && " · Read"}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message input */}
      <form
        onSubmit={handleSend}
        className="flex items-center gap-2 px-4 py-3 border-t border-gray-200 bg-white shrink-0"
      >
        <button
          type="button"
          className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
        >
          <ImagePlus className="w-5 h-5" />
        </button>
        <input
          ref={inputRef}
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 px-4 py-2.5 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white"
        />
        <button
          type="submit"
          disabled={!newMessage.trim() || sendMessage.isPending}
          className="p-2.5 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {sendMessage.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      </form>
    </div>
  );
}
