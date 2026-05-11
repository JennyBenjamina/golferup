/**
 * Socket.io server for real-time messaging.
 *
 * Deploy this as a standalone Node.js process on Railway or Fly.io.
 * It connects to the same Neon database and authenticates via JWT.
 *
 * To run locally:
 *   npx ts-node src/server/realtime/server.ts
 *
 * Environment variables needed:
 *   DATABASE_URL - same Neon connection string
 *   NEXTAUTH_SECRET - to verify JWT tokens
 *   PORT - server port (default 3001)
 *   CORS_ORIGIN - your Next.js app URL (default http://localhost:3000)
 */

import type {
  ClientToServerEvents,
  ServerToClientEvents,
  SocketData,
} from "./events";

// This file is a blueprint. Uncomment and install socket.io to activate:
//
// import { Server } from "socket.io";
// import { createServer } from "http";
//
// const httpServer = createServer();
// const io = new Server<ClientToServerEvents, ServerToClientEvents, {}, SocketData>(httpServer, {
//   cors: {
//     origin: process.env.CORS_ORIGIN || "http://localhost:3000",
//     methods: ["GET", "POST"],
//     credentials: true,
//   },
// });
//
// // JWT authentication middleware
// io.use(async (socket, next) => {
//   const token = socket.handshake.auth.token;
//   if (!token) return next(new Error("Authentication required"));
//
//   try {
//     // Verify the JWT token using your NextAuth secret
//     // const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET!);
//     // socket.data.userId = decoded.id;
//     // socket.data.email = decoded.email;
//     next();
//   } catch {
//     next(new Error("Invalid token"));
//   }
// });
//
// io.on("connection", (socket) => {
//   const userId = socket.data.userId;
//
//   // Join user's personal room for notifications
//   socket.join(`user:${userId}`);
//
//   // Broadcast presence
//   io.emit("presence:update", {
//     userId,
//     online: true,
//     lastSeen: new Date().toISOString(),
//   });
//
//   // Handle conversation rooms
//   socket.on("conversation:join", (conversationId) => {
//     socket.join(`conversation:${conversationId}`);
//   });
//
//   socket.on("conversation:leave", (conversationId) => {
//     socket.leave(`conversation:${conversationId}`);
//   });
//
//   // Handle typing indicators
//   socket.on("typing:start", (conversationId) => {
//     socket.to(`conversation:${conversationId}`).emit("typing:indicator", {
//       conversationId,
//       userId,
//       isTyping: true,
//     });
//   });
//
//   socket.on("typing:stop", (conversationId) => {
//     socket.to(`conversation:${conversationId}`).emit("typing:indicator", {
//       conversationId,
//       userId,
//       isTyping: false,
//     });
//   });
//
//   socket.on("disconnect", () => {
//     io.emit("presence:update", {
//       userId,
//       online: false,
//       lastSeen: new Date().toISOString(),
//     });
//   });
// });
//
// const PORT = parseInt(process.env.PORT || "3001", 10);
// httpServer.listen(PORT, () => {
//   console.log(`Socket.io server running on port ${PORT}`);
// });

export {};
