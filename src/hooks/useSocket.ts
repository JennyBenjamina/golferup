/**
 * Socket.io client hook for real-time messaging.
 *
 * Currently returns a no-op implementation since the Socket.io server
 * hasn't been deployed yet. The app uses polling (refetchInterval)
 * as a fallback in the meantime.
 *
 * To activate real-time:
 * 1. npm install socket.io-client
 * 2. Deploy the Socket.io server (src/server/realtime/server.ts)
 * 3. Set NEXT_PUBLIC_SOCKET_URL in your env
 * 4. Uncomment the implementation below
 */

import { useEffect, useCallback, useRef } from "react";
import type { ServerToClientEvents } from "@/server/realtime/events";

type EventHandler<T extends keyof ServerToClientEvents> = ServerToClientEvents[T];

interface UseSocketOptions {
  conversationId?: string;
  onNewMessage?: EventHandler<"message:new">;
  onTypingIndicator?: EventHandler<"typing:indicator">;
  onPresenceUpdate?: EventHandler<"presence:update">;
  onMessageRead?: EventHandler<"message:read">;
}

export function useSocket(options: UseSocketOptions) {
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Placeholder: in production, this connects to the Socket.io server
  // const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL;

  useEffect(() => {
    // When Socket.io is deployed, connect here:
    // const socket = io(socketUrl, { auth: { token: sessionToken } });
    // if (options.conversationId) socket.emit("conversation:join", conversationId);
    // socket.on("message:new", options.onNewMessage);
    // etc.

    return () => {
      // socket.disconnect();
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [options.conversationId]);

  const sendTypingStart = useCallback((conversationId: string) => {
    // socket.emit("typing:start", conversationId);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      // socket.emit("typing:stop", conversationId);
    }, 3000);
  }, []);

  const sendTypingStop = useCallback((conversationId: string) => {
    // socket.emit("typing:stop", conversationId);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
  }, []);

  return {
    isConnected: false, // Will be true when Socket.io is active
    sendTypingStart,
    sendTypingStop,
  };
}
