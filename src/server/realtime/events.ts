/**
 * Socket.io event types shared between client and server.
 *
 * The real-time server runs as a separate Node.js process
 * (deployed on Railway or Fly.io) because Vercel doesn't
 * support persistent WebSocket connections.
 *
 * For now, the app uses polling (refetchInterval) as a fallback.
 * When you're ready to go real-time:
 *
 * 1. npm install socket.io socket.io-client
 * 2. Create a standalone server using the config in server.ts
 * 3. Deploy to Railway/Fly.io
 * 4. Set NEXT_PUBLIC_SOCKET_URL in your env
 * 5. Use the useSocket hook in components
 */

// Events sent from client → server
export interface ClientToServerEvents {
  // Join a conversation room
  "conversation:join": (conversationId: string) => void;

  // Leave a conversation room
  "conversation:leave": (conversationId: string) => void;

  // Send typing indicator
  "typing:start": (conversationId: string) => void;
  "typing:stop": (conversationId: string) => void;

  // User comes online
  "presence:online": () => void;
}

// Events sent from server → client
export interface ServerToClientEvents {
  // New message received
  "message:new": (data: {
    id: string;
    conversationId: string;
    senderId: string;
    body: string;
    imageUrl: string | null;
    createdAt: string;
  }) => void;

  // Message was read
  "message:read": (data: {
    conversationId: string;
    readBy: string;
    readAt: string;
  }) => void;

  // Someone is typing
  "typing:indicator": (data: {
    conversationId: string;
    userId: string;
    isTyping: boolean;
  }) => void;

  // User presence update
  "presence:update": (data: {
    userId: string;
    online: boolean;
    lastSeen: string;
  }) => void;

  // New offer notification
  "offer:new": (data: {
    offerId: string;
    listingId: string;
    listingTitle: string;
    amount: string;
    buyerName: string;
  }) => void;

  // Offer status change
  "offer:update": (data: {
    offerId: string;
    status: string;
    listingTitle: string;
  }) => void;
}

// Socket data attached to each connection
export interface SocketData {
  userId: string;
  email: string;
}
