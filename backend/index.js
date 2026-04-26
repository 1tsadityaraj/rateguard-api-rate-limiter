require("dotenv").config();

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const http = require("http");
const { Server } = require("socket.io");

const connectDB = require("./config/db");
const { getClient } = require("./services/redisClient");
const { createRateLimiter } = require("./middleware/rateLimiter");
const apiKeyAuth = require("./middleware/apiKeyAuth");

// Route imports
const statsRoutes = require("./routes/stats");
const usersRoutes = require("./routes/users");
const adminRoutes = require("./routes/admin");
const apiKeyRoutes = require("./routes/apiKeys");
const protectedRoutes = require("./routes/protected");

// ─── Initialize Express ─────────────────────────────────────────────────────
const app = express();
const server = http.createServer(app);

// ─── Socket.io Setup ────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

app.set("io", io);

io.on("connection", (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);
  socket.on("disconnect", () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
});

// ─── Periodic Stats Broadcast ───────────────────────────────────────────────
// Emit aggregated stats every second for real-time dashboard
setInterval(async () => {
  if (io.engine.clientsCount === 0) return; // Skip if no clients

  try {
    const { getMongoStatus } = require("./config/db");
    const LogStore = getMongoStatus()
      ? require("./models/RequestLog")
      : require("./services/memoryStore").RequestLogStore;

    const now = new Date();
    const oneMinuteAgo = new Date(now - 60_000);
    const oneHourAgo = new Date(now - 3_600_000);

    const [rpm, rph, activeIPs] = await Promise.all([
      LogStore.countDocuments({ timestamp: { $gte: oneMinuteAgo } }),
      LogStore.countDocuments({ timestamp: { $gte: oneHourAgo } }),
      LogStore.distinct("ip", { timestamp: { $gte: oneHourAgo } }),
    ]);

    const { BlockedStore } = require("./services/memoryStore");
    const blocked = BlockedStore.count();

    io.emit("stats-update", {
      rpm,
      rph,
      blocked,
      activeUsers: activeIPs.length,
      avgLatency: 0, // Will be enriched client-side from request logs
    });
  } catch {
    // Never crash from stats broadcasting
  }
}, 2000);

// ─── Security ───────────────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: false, // Allow inline scripts for development
  crossOriginEmbedderPolicy: false,
}));

// ─── Global Middleware ──────────────────────────────────────────────────────
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

// Trust proxy for correct IP detection behind load balancers
app.set("trust proxy", 1);

// ─── API Key Resolution (before rate limiter) ───────────────────────────────
app.use("/api", apiKeyAuth);

// ─── Rate Limiter on protected routes ───────────────────────────────────────
const algorithm = process.env.ALGORITHM || "sliding-window";

app.use(
  "/api/protected",
  createRateLimiter({
    algorithm,
    limit: parseInt(process.env.DEFAULT_RATE_LIMIT, 10) || 100,
    windowSec: parseInt(process.env.DEFAULT_WINDOW_SECONDS, 10) || 60,
  })
);

// Token-bucket limiter variant
app.use(
  "/api/tb",
  createRateLimiter({
    algorithm: "token-bucket",
    limit: parseInt(process.env.DEFAULT_RATE_LIMIT, 10) || 100,
    windowSec: parseInt(process.env.DEFAULT_WINDOW_SECONDS, 10) || 60,
  })
);

// ─── Routes ─────────────────────────────────────────────────────────────────
app.use("/api", statsRoutes);
app.use("/api", adminRoutes);
app.use("/api/auth", usersRoutes);
app.use("/api/keys", apiKeyRoutes);
app.use("/api/protected", protectedRoutes);
app.use("/api/tb", protectedRoutes);

// Root route
app.get("/", (req, res) => {
  res.json({
    success: true,
    data: {
      name: "RateGuard API",
      version: "1.0.0",
      description: "Distributed API Rate Limiter",
      endpoints: {
        health: "GET /api/health",
        stats: "GET /api/stats",
        topUsers: "GET /api/top-users",
        blockedUsers: "GET /api/blocked-users",
        alerts: "GET /api/alerts",
        logs: "GET /api/logs",
        block: "POST /api/block",
        unblock: "POST /api/unblock",
        exportLogs: "GET /api/logs/export",
        auth: "POST /api/auth/login | /api/auth/register",
        generateKey: "POST /api/keys/generate",
        listKeys: "GET /api/keys",
        revokeKey: "DELETE /api/keys/:id",
        protectedSW: "GET /api/protected/* (sliding-window)",
        protectedTB: "GET /api/tb/* (token-bucket)",
      },
    },
    error: null,
  });
});

// ─── 404 Handler ────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, data: null, error: "Route not found" });
});

// ─── Global Error Handler ───────────────────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({
    success: false,
    data: null,
    error: "Internal server error",
    ...(process.env.NODE_ENV === "development" && { message: err.message }),
  });
});

// ─── Start Server ───────────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT, 10) || 5000;

async function start() {
  await connectDB();
  getClient(); // Initialize Redis connection

  server.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════════════╗
║           🛡️  RateGuard API Server               ║
║──────────────────────────────────────────────────║
║  Port:       ${String(PORT).padEnd(35)}║
║  Env:        ${String(process.env.NODE_ENV || "development").padEnd(35)}║
║  Algorithm:  ${String(algorithm).padEnd(35)}║
║  Dashboard:  ${String(process.env.FRONTEND_URL || "http://localhost:5173").padEnd(35)}║
╚══════════════════════════════════════════════════╝
    `);
  });
}

start().catch((err) => {
  console.error("❌ Failed to start server:", err);
  process.exit(1);
});
