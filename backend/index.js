require("dotenv").config();

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const http = require("http");
const { Server } = require("socket.io");

const connectDB = require("./config/db");
const { getClient } = require("./services/redisClient");
const { createRateLimiter } = require("./middleware/rateLimiter");
const apiKeyAuth = require("./middleware/apiKeyAuth");

// Route imports
const statsRoutes = require("./routes/stats");
const authRoutes = require("./routes/auth");
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

// Store io instance on app for access in controllers/middleware
app.set("io", io);

io.on("connection", (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);
  socket.on("disconnect", () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
});

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
// Sliding-window limiter on the main API
app.use(
  "/api/protected",
  createRateLimiter({
    algorithm: "sliding-window",
    limit: parseInt(process.env.DEFAULT_RATE_LIMIT, 10) || 100,
    windowSec: parseInt(process.env.DEFAULT_WINDOW_SECONDS, 10) || 60,
  })
);

// Token-bucket limiter variant (can be used on different route groups)
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
app.use("/api/auth", authRoutes);
app.use("/api/keys", apiKeyRoutes);
app.use("/api/protected", protectedRoutes);

// Token-bucket protected routes (mirror of protected)
app.use("/api/tb", protectedRoutes);

// Root route
app.get("/", (req, res) => {
  res.json({
    name: "RateGuard API",
    version: "1.0.0",
    description: "Distributed API Rate Limiter",
    endpoints: {
      health: "/api/health",
      stats: "/api/stats",
      topUsers: "/api/top-users",
      blockedUsers: "/api/blocked-users",
      alerts: "/api/alerts",
      block: "POST /api/block",
      unblock: "POST /api/unblock",
      exportLogs: "/api/logs/export",
      auth: "/api/auth/login | /api/auth/register",
      apiKeys: "/api/keys",
      protectedSW: "/api/protected/* (sliding-window)",
      protectedTB: "/api/tb/* (token-bucket)",
    },
  });
});

// ─── 404 Handler ────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// ─── Global Error Handler ───────────────────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({
    error: "Internal server error",
    ...(process.env.NODE_ENV === "development" && { message: err.message }),
  });
});

// ─── Start Server ───────────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT, 10) || 5000;

async function start() {
  // Connect to databases
  await connectDB();
  getClient(); // Initialize Redis connection

  server.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════════════╗
║           🛡️  RateGuard API Server               ║
║──────────────────────────────────────────────────║
║  Port:       ${String(PORT).padEnd(35)}║
║  Env:        ${String(process.env.NODE_ENV || "development").padEnd(35)}║
║  Dashboard:  ${String(process.env.FRONTEND_URL || "http://localhost:5173").padEnd(35)}║
╚══════════════════════════════════════════════════╝
    `);
  });
}

start().catch((err) => {
  console.error("❌ Failed to start server:", err);
  process.exit(1);
});
