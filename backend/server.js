import express from "express";
import "dotenv/config";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";

import { connectDB } from "./lib/db.js";
import userRouter from "./routes/userRoutes.js";
import messageRouter from "./routes/messageRoutes.js";

// Create Express app
const app = express();

// Create HTTP server for Socket.io
const server = http.createServer(app);

// Initialize Socket.io server
export const io = new Server(server, {
  cors: {
    origin: "*", // Replace "*" with your frontend URL in production
  },
});

// Store online users: { userId: socketId }
export const userSocketMap = {};

// Handle Socket.io connections
io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId;
  console.log("User Connected:", userId);

  if (userId) userSocketMap[userId] = socket.id;

  // Emit list of online users to all clients
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log("User Disconnected:", userId);
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

// Middleware
app.use(express.json({ limit: "4mb" }));
app.use(cors());

// Routes
app.get("/api/status", (req, res) => res.send("Server is live"));
app.use("/api/auth", userRouter);
app.use("/api/messages", messageRouter);

// Connect to MongoDB
try {
  await connectDB();
  console.log("MongoDB connected successfully");
} catch (err) {
  console.error("MongoDB connection failed:", err);
  process.exit(1); // Stop server if DB fails
}

// Start server
const startServer = async () => {
    await connectDB();
    const PORT = process.env.PORT || 5001;
    server.listen(PORT, () => console.log("Server running on PORT:" + PORT));
  };
  startServer();
  