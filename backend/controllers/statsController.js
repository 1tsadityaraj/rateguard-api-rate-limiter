const { getMongoStatus } = require("../config/db");
const { getClient, getConnectionStatus } = require("../services/redisClient");
const { blockUser, PLANS } = require("../middleware/rateLimiter");
const { Parser } = require("json2csv");

/**
 * Get the appropriate RequestLog store based on DB availability.
 */
function getLogStore() {
  if (getMongoStatus()) {
    return require("../models/RequestLog");
  }
  return require("../services/memoryStore").RequestLogStore;
}

/**
 * GET /api/stats
 * Aggregate request metrics for the dashboard.
 */
async function getStats(req, res) {
  try {
    const now = new Date();
    const oneMinuteAgo = new Date(now - 60_000);
    const oneHourAgo = new Date(now - 3_600_000);
    const oneDayAgo = new Date(now - 86_400_000);
    const LogStore = getLogStore();

    const [
      requestsPerMinute,
      requestsPerHour,
      requestsPerDay,
      blockedToday,
      activeUserIPs,
      statusBreakdown,
      requestTimeline,
      avgLatencyResult,
    ] = await Promise.all([
      LogStore.countDocuments({ timestamp: { $gte: oneMinuteAgo } }),
      LogStore.countDocuments({ timestamp: { $gte: oneHourAgo } }),
      LogStore.countDocuments({ timestamp: { $gte: oneDayAgo } }),
      LogStore.countDocuments({
        timestamp: { $gte: oneDayAgo },
        blocked: true,
      }),
      LogStore.distinct("ip", { timestamp: { $gte: oneHourAgo } }),
      LogStore.aggregate([
        { $match: { timestamp: { $gte: oneDayAgo } } },
        {
          $group: {
            _id: {
              $switch: {
                branches: [
                  { case: { $lt: ["$status", 300] }, then: "success" },
                  { case: { $lt: ["$status", 400] }, then: "redirect" },
                  { case: { $eq: ["$status", 429] }, then: "rate_limited" },
                  { case: { $eq: ["$status", 403] }, then: "forbidden" },
                  { case: { $lt: ["$status", 500] }, then: "client_error" },
                ],
                default: "server_error",
              },
            },
            count: { $sum: 1 },
          },
        },
      ]),
      LogStore.aggregate([
        { $match: { timestamp: { $gte: oneHourAgo } } },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%dT%H:%M",
                date: "$timestamp",
              },
            },
            total: { $sum: 1 },
            blocked: {
              $sum: { $cond: [{ $eq: ["$blocked", true] }, 1, 0] },
            },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      LogStore.aggregate([
        { $match: { timestamp: { $gte: oneHourAgo } } },
        { $group: { _id: null, avgLatency: { $avg: "$latency" } } },
      ]),
    ]);

    // Count currently blocked users
    let blockedUsersCount = 0;
    if (getConnectionStatus()) {
      try {
        const redis = getClient();
        const keys = await redis.keys("ratelimit:blocked:*");
        blockedUsersCount = keys.length;
      } catch {}
    } else {
      const { BlockedStore } = require("../services/memoryStore");
      blockedUsersCount = BlockedStore.count();
    }

    const statusMap = {};
    statusBreakdown.forEach((s) => {
      statusMap[s._id] = s.count;
    });

    const avgLatency =
      avgLatencyResult.length > 0 ? Math.round(avgLatencyResult[0].avgLatency || 0) : 0;

    res.json({
      success: true,
      data: {
        rpm: requestsPerMinute,
        rph: requestsPerHour,
        blocked: blockedUsersCount,
        activeUsers: activeUserIPs.length,
        avgLatency,
        requestsPerDay,
        blockedRequests: blockedToday,
        statusBreakdown: statusMap,
        timeline: requestTimeline.map((t) => ({
          time: t._id,
          total: t.total,
          blocked: t.blocked,
        })),
      },
      error: null,
    });
  } catch (err) {
    console.error("Stats error:", err);
    res.status(500).json({ success: false, data: null, error: "Failed to fetch stats" });
  }
}

/**
 * GET /api/top-users
 * Returns the most active users/IPs in the last hour.
 */
async function getTopUsers(req, res) {
  try {
    const oneHourAgo = new Date(Date.now() - 3_600_000);
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 100);
    const LogStore = getLogStore();

    const topUsers = await LogStore.aggregate([
      { $match: { timestamp: { $gte: oneHourAgo } } },
      {
        $group: {
          _id: { ip: "$ip", userId: "$userId" },
          requestCount: { $sum: 1 },
          blockedCount: {
            $sum: { $cond: [{ $eq: ["$blocked", true] }, 1, 0] },
          },
          lastRequest: { $max: "$timestamp" },
          paths: { $addToSet: "$route" },
        },
      },
      { $sort: { requestCount: -1 } },
      { $limit: limit },
    ]);

    const { BlockedStore } = require("../services/memoryStore");

    const enriched = await Promise.all(
      topUsers.map(async (user) => {
        const identifier = user._id.userId || user._id.ip;
        let isCurrentlyBlocked = false;
        let blockTTL = 0;

        if (getConnectionStatus()) {
          try {
            const redis = getClient();
            const ttl = await redis.ttl(`ratelimit:blocked:${identifier}`);
            if (ttl > 0) {
              isCurrentlyBlocked = true;
              blockTTL = ttl;
            }
          } catch {}
        } else {
          const ttl = BlockedStore.getTTL(identifier);
          if (ttl > 0) {
            isCurrentlyBlocked = true;
            blockTTL = ttl;
          }
        }

        return {
          ip: user._id.ip,
          userId: user._id.userId,
          requestCount: user.requestCount,
          blockedCount: user.blockedCount,
          lastRequest: user.lastRequest,
          topPaths: (user.paths || []).slice(0, 5),
          isBlocked: isCurrentlyBlocked,
          blockTTL,
        };
      })
    );

    res.json({ success: true, data: enriched, error: null });
  } catch (err) {
    console.error("Top users error:", err);
    res.status(500).json({ success: false, data: null, error: "Failed to fetch top users" });
  }
}

/**
 * POST /api/block
 * Manually block a user/IP.
 */
async function manualBlock(req, res) {
  try {
    const { identifier, duration } = req.body;

    if (!identifier) {
      return res
        .status(400)
        .json({ success: false, data: null, error: "identifier is required" });
    }

    const blockDuration =
      duration || parseInt(process.env.BLOCK_DURATION_MINUTES, 10) || 10;

    let success;
    if (getConnectionStatus()) {
      success = await blockUser(identifier, blockDuration);
    } else {
      const { BlockedStore } = require("../services/memoryStore");
      success = BlockedStore.block(identifier, blockDuration);
    }

    if (!success) {
      return res
        .status(500)
        .json({ success: false, data: null, error: "Failed to block user" });
    }

    const io = req.app.get("io");
    if (io) {
      io.emit("alert", {
        type: "block",
        message: `${identifier} manually blocked for ${blockDuration} minutes`,
        ip: identifier,
        timestamp: new Date(),
      });
      io.emit("user-blocked", {
        identifier,
        duration: blockDuration,
        timestamp: new Date(),
      });
    }

    res.json({
      success: true,
      data: { identifier, duration: blockDuration },
      error: null,
    });
  } catch (err) {
    console.error("Block error:", err);
    res.status(500).json({ success: false, data: null, error: "Failed to block user" });
  }
}

/**
 * POST /api/unblock
 * Remove a block from a user/IP.
 */
async function unblockUser(req, res) {
  try {
    const { identifier } = req.body;

    if (!identifier) {
      return res
        .status(400)
        .json({ success: false, data: null, error: "identifier is required" });
    }

    if (getConnectionStatus()) {
      const redis = getClient();
      await redis.del(`ratelimit:blocked:${identifier}`);
    } else {
      const { BlockedStore } = require("../services/memoryStore");
      BlockedStore.unblock(identifier);
    }

    const io = req.app.get("io");
    if (io) {
      io.emit("user-unblocked", { identifier });
    }

    res.json({
      success: true,
      data: { identifier },
      error: null,
    });
  } catch (err) {
    console.error("Unblock error:", err);
    res.status(500).json({ success: false, data: null, error: "Failed to unblock user" });
  }
}

/**
 * GET /api/blocked-users
 * List all currently blocked users with their TTLs.
 */
async function getBlockedUsers(req, res) {
  try {
    if (getConnectionStatus()) {
      const redis = getClient();
      const keys = await redis.keys("ratelimit:blocked:*");

      const blockedUsers = await Promise.all(
        keys.map(async (key) => {
          const identifier = key.replace("ratelimit:blocked:", "");
          const ttl = await redis.ttl(key);
          return {
            identifier,
            ttl,
            expiresAt: new Date(Date.now() + ttl * 1000),
          };
        })
      );

      blockedUsers.sort((a, b) => b.ttl - a.ttl);
      return res.json({ success: true, data: blockedUsers, error: null });
    }

    const { BlockedStore } = require("../services/memoryStore");
    res.json({ success: true, data: BlockedStore.getAll(), error: null });
  } catch (err) {
    console.error("Blocked users error:", err);
    res.status(500).json({ success: false, data: null, error: "Failed to fetch blocked users" });
  }
}

/**
 * GET /api/health
 * System health check.
 */
async function healthCheck(req, res) {
  const mongoStatus = getMongoStatus()
    ? "connected"
    : process.env.NO_DB === "true"
    ? "disabled (memory mode)"
    : "disconnected";

  const redisStatus = getConnectionStatus()
    ? "connected"
    : process.env.NO_DB === "true"
    ? "disabled (memory mode)"
    : "disconnected";

  const health = {
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date(),
    mode: process.env.NO_DB === "true" ? "memory-only (trial)" : "production",
    redis: redisStatus,
    mongo: mongoStatus,
  };

  const httpStatus =
    process.env.NO_DB === "true"
      ? 200
      : redisStatus === "connected" && mongoStatus === "connected"
      ? 200
      : 503;

  res.status(httpStatus).json({ success: true, data: health, error: null });
}

/**
 * GET /api/logs
 * Paginated request logs.
 */
async function getLogs(req, res) {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
    const LogStore = getLogStore();

    const total = await LogStore.countDocuments({});
    const logs = await LogStore.find({})
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
      error: null,
    });
  } catch (err) {
    console.error("Logs error:", err);
    res.status(500).json({ success: false, data: null, error: "Failed to fetch logs" });
  }
}

/**
 * GET /api/logs/export
 * Export request logs as CSV.
 */
async function exportLogs(req, res) {
  try {
    const hours = parseInt(req.query.hours, 10) || 24;
    const since = new Date(Date.now() - hours * 3_600_000);
    const LogStore = getLogStore();

    const logs = await LogStore.find({ timestamp: { $gte: since } })
      .sort({ timestamp: -1 })
      .limit(10_000)
      .lean();

    const fields = [
      "ip",
      "userId",
      "method",
      "route",
      "status",
      "algorithm",
      "blocked",
      "latency",
      "timestamp",
    ];

    const parser = new Parser({ fields });
    const csv = parser.parse(logs);

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=rateguard-logs-${hours}h.csv`
    );
    res.send(csv);
  } catch (err) {
    console.error("Export error:", err);
    res.status(500).json({ success: false, data: null, error: "Failed to export logs" });
  }
}

/**
 * GET /api/alerts
 * Detect abuse spikes.
 */
async function getAlerts(req, res) {
  try {
    const fiveMinAgo = new Date(Date.now() - 300_000);
    const LogStore = getLogStore();

    const spikes = await LogStore.aggregate([
      { $match: { timestamp: { $gte: fiveMinAgo } } },
      {
        $group: {
          _id: "$ip",
          count: { $sum: 1 },
          blockedCount: {
            $sum: { $cond: [{ $eq: ["$blocked", true] }, 1, 0] },
          },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 20 },
    ]);

    const alerts = spikes
      .filter((s) => s.count >= 10)
      .map((s) => ({
        type: s.blockedCount > 0 ? "block" : "spike",
        severity:
          s.count > 200 ? "critical" : s.count > 100 ? "warning" : "info",
        ip: s._id,
        requestCount: s.count,
        blockedCount: s.blockedCount,
        message: `${s._id} made ${s.count} requests in the last 5 minutes`,
        timestamp: new Date(),
      }));

    res.json({ success: true, data: alerts, error: null });
  } catch (err) {
    console.error("Alerts error:", err);
    res.status(500).json({ success: false, data: null, error: "Failed to fetch alerts" });
  }
}

module.exports = {
  getStats,
  getTopUsers,
  manualBlock,
  unblockUser,
  getBlockedUsers,
  healthCheck,
  getLogs,
  exportLogs,
  getAlerts,
};
