"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { trpc } from "@/lib/trpc";
import { ConversationList } from "@/components/chat/ConversationList";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { MessageCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function MessagesPage() {
  const { data: session } = useSession();
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);

  const { data: conversations, isLoading } =
    trpc.messages.listConversations.useQuery(undefined, {
      refetchInterval: 5000,
    });

  const currentUserId = session?.user?.id ?? "";

  const activeConversation = conversations?.find(
    (c) => c.conversation.id === activeConversationId
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto h-[calc(100vh-4rem)]">
      <div className="flex h-full border-x border-gray-200">
        {/* Conversation list - sidebar */}
        <div
          className={cn(
            "w-full md:w-80 lg:w-96 border-r border-gray-200 bg-white flex flex-col shrink-0",
            activeConversationId ? "hidden md:flex" : "flex"
          )}
        >
          <div className="px-4 py-3 border-b border-gray-200">
            <h1 className="text-lg font-semibold text-gray-900">Messages</h1>
          </div>
          <div className="flex-1 overflow-y-auto">
            <ConversationList
              conversations={conversations ?? []}
              activeId={activeConversationId}
              currentUserId={currentUserId}
              onSelect={setActiveConversationId}
            />
          </div>
        </div>

        {/* Chat window */}
        <div
          className={cn(
            "flex-1 flex flex-col bg-white",
            activeConversationId ? "flex" : "hidden md:flex"
          )}
        >
          {activeConversation ? (
            <ChatWindow
              conversationId={activeConversation.conversation.id}
              currentUserId={currentUserId}
              otherUser={activeConversation.otherUser}
              listing={activeConversation.listing}
              onBack={() => setActiveConversationId(null)}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-6">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <MessageCircle className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">
                Your Messages
              </h3>
              <p className="text-sm text-gray-500 max-w-sm">
                Select a conversation to start chatting, or message a seller
                from their listing page.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
