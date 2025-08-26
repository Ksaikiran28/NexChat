import express from "express";
import "dotenv/config";
import cors from "cors";
import http from "http";
import { connectDB } from "./lib/db.js";
import userRouter from "./routes/userRoutes.js";
import messageRouter from "./routes/messageRoutes.js";
import { Server } from "socket.io";

// Create express app & HTTP server
const app = express();
const server = http.createServer(app);

// ✅ Allowed origins (local + production frontend)
const allowedOrigins = [
  "http://localhost:5173",                // local dev
  "https://nex-chat-xi.vercel.app"        // deployed frontend
];

// ✅ Express CORS config
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true
}));

// ✅ Socket.io server with open CORS (you can restrict if needed)
export const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"]
  }
});

// Store online users
export const userSocketMap = {};

// Socket.io connection handler
io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId;
  console.log("User Connected:", userId);

  if (userId) userSocketMap[userId] = socket.id;

  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  socket.on("disconnect", () => {
    console.log("User Disconnected:", userId);
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

// Middleware
app.use(express.json({ limit: "4mb" }));

// Routes
app.use("/api/status", (req, res) => res.send("Server is live 🚀"));
app.use("/api/auth", userRouter);
app.use("/api/messages", messageRouter);

// Connect to MongoDB
await connectDB();

// Start server (only locally, Vercel handles prod)
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 5001;
  server.listen(PORT, () => console.log("Server running on PORT: " + PORT));
}

export default server;
