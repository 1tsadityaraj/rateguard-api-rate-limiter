const RequestLog = require("../models/RequestLog");
const { getClient, getConnectionStatus } = require("../services/redisClient");
const { blockUser } = require("../middleware/rateLimiter");
const { Parser } = require("json2csv");

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

    // Run aggregations in parallel
    const [
      requestsPerMinute,
      requestsPerHour,
      requestsPerDay,
      blockedToday,
      activeUsers,
      statusBreakdown,
      requestTimeline,
    ] = await Promise.all([
      // Requests in the last minute
      RequestLog.countDocuments({ timestamp: { $gte: oneMinuteAgo } }),

      // Requests in the last hour
      RequestLog.countDocuments({ timestamp: { $gte: oneHourAgo } }),

      // Requests in the last 24 hours
      RequestLog.countDocuments({ timestamp: { $gte: oneDayAgo } }),

      // Blocked requests today
      RequestLog.countDocuments({
        timestamp: { $gte: oneDayAgo },
        blocked: true,
      }),

      // Unique active users/IPs in the last hour
      RequestLog.distinct("ip", {
        timestamp: { $gte: oneHourAgo },
      }).then((ips) => ips.length),

      // Status code breakdown (last 24h)
      RequestLog.aggregate([
        { $match: { timestamp: { $gte: oneDayAgo } } },
        {
          $group: {
            _id: {
              $switch: {
                branches: [
                  {
                    case: { $lt: ["$statusCode", 300] },
                    then: "success",
                  },
                  {
                    case: { $lt: ["$statusCode", 400] },
                    then: "redirect",
                  },
                  {
                    case: { $eq: ["$statusCode", 429] },
                    then: "rate_limited",
                  },
                  {
                    case: { $lt: ["$statusCode", 500] },
                    then: "client_error",
                  },
                ],
                default: "server_error",
              },
            },
            count: { $sum: 1 },
          },
        },
      ]),

      // Request timeline (last 60 minutes, grouped per minute)
      RequestLog.aggregate([
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
    ]);

    // Count currently blocked users in Redis
    let blockedUsersCount = 0;
    if (getConnectionStatus()) {
      try {
        const redis = getClient();
        const keys = await redis.keys("rg:blocked:*");
        blockedUsersCount = keys.length;
      } catch {
        /* ignore */
      }
    }

    // Convert status breakdown to a cleaner format
    const statusMap = {};
    statusBreakdown.forEach((s) => {
      statusMap[s._id] = s.count;
    });

    res.json({
      requestsPerMinute,
      requestsPerHour,
      requestsPerDay,
      blockedRequests: blockedToday,
      activeUsers,
      blockedUsersCount,
      statusBreakdown: statusMap,
      timeline: requestTimeline.map((t) => ({
        time: t._id,
        total: t.total,
        blocked: t.blocked,
      })),
    });
  } catch (err) {
    console.error("Stats error:", err);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
}

/**
 * GET /api/top-users
 * Returns the most active users/IPs in the last hour.
 */
async function getTopUsers(req, res) {
  try {
    const oneHourAgo = new Date(Date.now() - 3_600_000);
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);

    const topUsers = await RequestLog.aggregate([
      { $match: { timestamp: { $gte: oneHourAgo } } },
      {
        $group: {
          _id: { ip: "$ip", userId: "$userId" },
          requestCount: { $sum: 1 },
          blockedCount: {
            $sum: { $cond: [{ $eq: ["$blocked", true] }, 1, 0] },
          },
          lastRequest: { $max: "$timestamp" },
          paths: { $addToSet: "$path" },
        },
      },
      { $sort: { requestCount: -1 } },
      { $limit: limit },
    ]);

    // Check block status for each user
    const enriched = await Promise.all(
      topUsers.map(async (user) => {
        const identifier = user._id.userId || user._id.ip;
        let isCurrentlyBlocked = false;
        let blockTTL = 0;

        if (getConnectionStatus()) {
          try {
            const redis = getClient();
            const ttl = await redis.ttl(`rg:blocked:${identifier}`);
            if (ttl > 0) {
              isCurrentlyBlocked = true;
              blockTTL = ttl;
            }
          } catch {
            /* ignore */
          }
        }

        return {
          ip: user._id.ip,
          userId: user._id.userId,
          requestCount: user.requestCount,
          blockedCount: user.blockedCount,
          lastRequest: user.lastRequest,
          topPaths: user.paths.slice(0, 5),
          isBlocked: isCurrentlyBlocked,
          blockTTL,
        };
      })
    );

    res.json(enriched);
  } catch (err) {
    console.error("Top users error:", err);
    res.status(500).json({ error: "Failed to fetch top users" });
  }
}

/**
 * POST /api/block
 * Manually block a user/IP.
 * Body: { identifier: string, duration?: number (minutes) }
 */
async function manualBlock(req, res) {
  try {
    const { identifier, duration } = req.body;

    if (!identifier) {
      return res.status(400).json({ error: "identifier is required" });
    }

    const blockDuration =
      duration ||
      parseInt(process.env.BLOCK_DURATION_MINUTES, 10) ||
      10;

    const success = await blockUser(identifier, blockDuration);

    if (!success) {
      return res.status(500).json({ error: "Failed to block user (Redis unavailable)" });
    }

    // Emit block event
    if (req.app.get("io")) {
      req.app.get("io").emit("user-blocked", {
        identifier,
        duration: blockDuration,
        timestamp: new Date(),
      });
    }

    res.json({
      message: `User ${identifier} blocked for ${blockDuration} minutes`,
      identifier,
      duration: blockDuration,
    });
  } catch (err) {
    console.error("Block error:", err);
    res.status(500).json({ error: "Failed to block user" });
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
      return res.status(400).json({ error: "identifier is required" });
    }

    if (!getConnectionStatus()) {
      return res.status(500).json({ error: "Redis unavailable" });
    }

    const redis = getClient();
    await redis.del(`rg:blocked:${identifier}`);

    if (req.app.get("io")) {
      req.app.get("io").emit("user-unblocked", { identifier });
    }

    res.json({ message: `User ${identifier} unblocked`, identifier });
  } catch (err) {
    console.error("Unblock error:", err);
    res.status(500).json({ error: "Failed to unblock user" });
  }
}

/**
 * GET /api/blocked-users
 * List all currently blocked users with their TTLs.
 */
async function getBlockedUsers(req, res) {
  try {
    if (!getConnectionStatus()) {
      return res.json([]);
    }

    const redis = getClient();
    const keys = await redis.keys("rg:blocked:*");

    const blockedUsers = await Promise.all(
      keys.map(async (key) => {
        const identifier = key.replace("rg:blocked:", "");
        const ttl = await redis.ttl(key);
        return { identifier, ttl, expiresAt: new Date(Date.now() + ttl * 1000) };
      })
    );

    // Sort by TTL descending (most time remaining first)
    blockedUsers.sort((a, b) => b.ttl - a.ttl);

    res.json(blockedUsers);
  } catch (err) {
    console.error("Blocked users error:", err);
    res.status(500).json({ error: "Failed to fetch blocked users" });
  }
}

/**
 * GET /api/health
 * System health check.
 */
async function healthCheck(req, res) {
  const mongoose = require("mongoose");

  const health = {
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date(),
    services: {
      redis: getConnectionStatus() ? "connected" : "disconnected",
      mongodb:
        mongoose.connection.readyState === 1
          ? "connected"
          : "disconnected",
    },
  };

  const httpStatus =
    health.services.redis === "connected" &&
    health.services.mongodb === "connected"
      ? 200
      : 503;

  res.status(httpStatus).json(health);
}

/**
 * GET /api/logs/export
 * Export request logs as CSV.
 */
async function exportLogs(req, res) {
  try {
    const hours = parseInt(req.query.hours, 10) || 24;
    const since = new Date(Date.now() - hours * 3_600_000);

    const logs = await RequestLog.find({ timestamp: { $gte: since } })
      .sort({ timestamp: -1 })
      .limit(10_000)
      .lean();

    const fields = [
      "ip",
      "userId",
      "method",
      "path",
      "statusCode",
      "algorithm",
      "blocked",
      "responseTime",
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
    res.status(500).json({ error: "Failed to export logs" });
  }
}

/**
 * GET /api/alerts
 * Detect abuse spikes: returns identifiers with abnormally high request rates.
 */
async function getAlerts(req, res) {
  try {
    const fiveMinAgo = new Date(Date.now() - 300_000);

    const spikes = await RequestLog.aggregate([
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
      { $match: { count: { $gte: 50 } } }, // threshold: 50 req/5min
      { $sort: { count: -1 } },
      { $limit: 20 },
    ]);

    const alerts = spikes.map((s) => ({
      type: s.blockedCount > 0 ? "abuse" : "spike",
      severity: s.count > 200 ? "critical" : s.count > 100 ? "warning" : "info",
      ip: s._id,
      requestCount: s.count,
      blockedCount: s.blockedCount,
      message: `${s._id} made ${s.count} requests in the last 5 minutes`,
    }));

    res.json(alerts);
  } catch (err) {
    console.error("Alerts error:", err);
    res.status(500).json({ error: "Failed to fetch alerts" });
  }
}

module.exports = {
  getStats,
  getTopUsers,
  manualBlock,
  unblockUser,
  getBlockedUsers,
  healthCheck,
  exportLogs,
  getAlerts,
};
