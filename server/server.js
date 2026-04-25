import "dotenv/config";
import { env } from "./lib/env.js";
import express from "express";
import cors from "cors";
import http from "http";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { Server } from "socket.io";
import { connectDB } from "./lib/db.js";
import { logger } from "./lib/logger.js";
import { attachRedisAdapter } from "./lib/socketAdapter.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";
import { apiLimiter } from "./middleware/rateLimit.js";
import userRouter from "./routes/userRoutes.js";
import messageRouter from "./routes/messageRoutes.js";
import uploadRouter from "./routes/uploadRoutes.js";

const app = express();
const server = http.createServer(app);

const corsOptions = { origin: env.CLIENT_URL, credentials: true };

export const io = new Server(server, { cors: corsOptions });
export const userSocketMap = {};

io.use((socket, next) => {
  try {
    const cookieHeader = socket.handshake.headers.cookie || "";
    const cookieToken = Object.fromEntries(
      cookieHeader.split(";").map((c) => c.trim().split("=").map(decodeURIComponent))
    ).token;
    const token = cookieToken || socket.handshake.auth?.token;
    if (!token) return next(new Error("Unauthorized"));
    const decoded = jwt.verify(token, env.JWT_SECRET);
    socket.data.userId = decoded.userId;
    next();
  } catch {
    next(new Error("Unauthorized"));
  }
});

io.on("connection", (socket) => {
  const userId = socket.data.userId;
  logger.debug({ userId, socketId: socket.id }, "socket connected");
  userSocketMap[userId] = socket.id;
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  socket.on("typing:start", ({ to } = {}) => {
    const targetSocketId = userSocketMap[String(to)];
    if (targetSocketId) io.to(targetSocketId).emit("typing:start", { from: userId });
  });

  socket.on("typing:stop", ({ to } = {}) => {
    const targetSocketId = userSocketMap[String(to)];
    if (targetSocketId) io.to(targetSocketId).emit("typing:stop", { from: userId });
  });

  socket.on("disconnect", () => {
    logger.debug({ userId, socketId: socket.id }, "socket disconnected");
    if (userSocketMap[userId] === socket.id) delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});

app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json({ limit: "4mb" }));
app.use(cookieParser());
app.use(pinoHttp({ logger, customLogLevel: (_req, res) => (res.statusCode >= 500 ? "error" : "info") }));
app.use("/api", apiLimiter);

app.get("/api/health", (_req, res) => {
  const dbReady = mongoose.connection.readyState === 1;
  res.status(dbReady ? 200 : 503).json({
    status: dbReady ? "ok" : "degraded",
    db: dbReady ? "connected" : "disconnected",
    uptime: process.uptime(),
  });
});

app.use("/api/auth", userRouter);
app.use("/api/messages", messageRouter);
app.use("/api/uploads", uploadRouter);

app.use(notFound);
app.use(errorHandler);

await connectDB();
await attachRedisAdapter(io);

server.listen(env.PORT, () => logger.info(`Server listening on port ${env.PORT}`));

const shutdown = async (signal) => {
  logger.info(`${signal} received — shutting down`);
  const timeout = setTimeout(() => {
    logger.error("Forced exit after 10s");
    process.exit(1);
  }, 10_000);
  try {
    await new Promise((resolve) => server.close(resolve));
    logger.info("HTTP server closed");
    io.close();
    logger.info("Socket.io closed");
    await mongoose.disconnect();
    logger.info("Mongo disconnected");
    clearTimeout(timeout);
    process.exit(0);
  } catch (err) {
    logger.error({ err }, "Error during shutdown");
    process.exit(1);
  }
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

export default server;
