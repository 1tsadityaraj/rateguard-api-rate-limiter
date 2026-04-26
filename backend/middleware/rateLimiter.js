const { getClient, getConnectionStatus } = require("../services/redisClient");
const { getMongoStatus } = require("../config/db");

// ─── Plan-based Limits ──────────────────────────────────────────────────────
const PLANS = {
  free: { limit: 100, window: 60 },
  pro: { limit: 1000, window: 60 },
  enterprise: { limit: Infinity, window: 60 },
};

// ─── In-memory fallback when Redis is unavailable ───────────────────────────
const memoryStore = new Map();

// Clean up stale in-memory entries every 60 seconds
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of memoryStore) {
    if (data.expiresAt && data.expiresAt < now) {
      memoryStore.delete(key);
    }
  }
}, 60_000);

// ─── Helpers ────────────────────────────────────────────────────────────────

function getClientIP(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.ip || req.socket?.remoteAddress || "unknown";
}

function getIdentifier(req) {
  return req.userId || getClientIP(req);
}

// ─── Token Bucket Algorithm ─────────────────────────────────────────────────
/**
 * Classic token-bucket: tokens refill at a steady rate.
 * Each request consumes one token. When the bucket is empty → 429.
 *
 * Redis keys:
 *   ratelimit:ip:{id}:tokens   – current token count
 *   ratelimit:ip:{id}:last     – timestamp of last refill
 */
async function tokenBucket(identifier, maxTokens, refillRate, windowSec) {
  const redis = getClient();
  const tokensKey = `ratelimit:ip:${identifier}:tokens`;
  const lastKey = `ratelimit:ip:${identifier}:last`;

  const luaScript = `
    local tokens_key   = KEYS[1]
    local last_key     = KEYS[2]
    local max_tokens   = tonumber(ARGV[1])
    local refill_rate  = tonumber(ARGV[2])
    local now          = tonumber(ARGV[3])
    local ttl          = tonumber(ARGV[4])

    local tokens = tonumber(redis.call('GET', tokens_key))
    local last   = tonumber(redis.call('GET', last_key))

    if tokens == nil then
      tokens = max_tokens
      last   = now
    end

    local elapsed   = math.max(0, now - last)
    local new_tokens = math.min(max_tokens, tokens + (elapsed * refill_rate))

    if new_tokens >= 1 then
      new_tokens = new_tokens - 1
      redis.call('SET', tokens_key, new_tokens, 'EX', ttl)
      redis.call('SET', last_key, now, 'EX', ttl)
      return {1, math.ceil(new_tokens), 0}
    else
      local retry_after = math.ceil((1 - new_tokens) / refill_rate)
      return {0, 0, retry_after}
    end
  `;

  const now = Date.now() / 1000;
  const result = await redis.eval(
    luaScript,
    2,
    tokensKey,
    lastKey,
    maxTokens,
    refillRate,
    now,
    windowSec * 2
  );

  return {
    allowed: result[0] === 1,
    remaining: result[1],
    retryAfter: result[2],
  };
}

// ─── Sliding Window Algorithm ───────────────────────────────────────────────
/**
 * Sliding window log using a Redis sorted set.
 * Each request is scored by its timestamp. We count entries
 * within the current window; if count ≥ limit → 429.
 *
 * Redis keys:
 *   ratelimit:user:{id}
 */
async function slidingWindow(identifier, limit, windowSec) {
  const redis = getClient();
  const key = `ratelimit:user:${identifier}`;

  const luaScript = `
    local key       = KEYS[1]
    local now       = tonumber(ARGV[1])
    local window    = tonumber(ARGV[2])
    local limit     = tonumber(ARGV[3])
    local member    = ARGV[4]

    local window_start = now - window

    redis.call('ZREMRANGEBYSCORE', key, '-inf', window_start)

    local count = redis.call('ZCARD', key)

    if count < limit then
      redis.call('ZADD', key, now, member)
      redis.call('EXPIRE', key, window + 1)
      return {1, limit - count - 1, 0}
    else
      local oldest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
      local retry_after = 0
      if #oldest > 0 then
        retry_after = math.ceil(tonumber(oldest[2]) + window - now)
      end
      return {0, 0, retry_after}
    end
  `;

  const now = Date.now() / 1000;
  const uniqueId = `${now}:${Math.random().toString(36).slice(2, 8)}`;

  const result = await redis.eval(
    luaScript,
    1,
    key,
    now,
    windowSec,
    limit,
    uniqueId
  );

  return {
    allowed: result[0] === 1,
    remaining: result[1],
    retryAfter: result[2],
  };
}

// ─── In-Memory Fallback (Sliding Window) ────────────────────────────────────
function slidingWindowMemory(identifier, limit, windowSec) {
  const now = Date.now();
  const windowMs = windowSec * 1000;
  const key = `mem:${identifier}`;

  if (!memoryStore.has(key)) {
    memoryStore.set(key, { timestamps: [], expiresAt: now + windowMs * 2 });
  }

  const entry = memoryStore.get(key);
  entry.timestamps = entry.timestamps.filter((t) => t > now - windowMs);
  entry.expiresAt = now + windowMs * 2;

  if (entry.timestamps.length < limit) {
    entry.timestamps.push(now);
    return {
      allowed: true,
      remaining: limit - entry.timestamps.length,
      retryAfter: 0,
    };
  }

  const oldest = entry.timestamps[0];
  const retryAfter = Math.ceil((oldest + windowMs - now) / 1000);
  return { allowed: false, remaining: 0, retryAfter };
}

// ─── Blocked User Check ────────────────────────────────────────────────────
async function isBlocked(identifier) {
  try {
    if (getConnectionStatus()) {
      const redis = getClient();
      const ttl = await redis.ttl(`ratelimit:blocked:${identifier}`);
      return ttl > 0 ? ttl : false;
    }
    const { BlockedStore } = require("../services/memoryStore");
    const ttl = BlockedStore.getTTL(identifier);
    return ttl > 0 ? ttl : false;
  } catch {
    return false; // Redis failure never crashes the server
  }
}

async function blockUser(identifier, durationMin) {
  try {
    if (getConnectionStatus()) {
      const redis = getClient();
      const durationSec = durationMin * 60;
      await redis.set(`ratelimit:blocked:${identifier}`, "1", "EX", durationSec);
      return true;
    }
    const { BlockedStore } = require("../services/memoryStore");
    return BlockedStore.block(identifier, durationMin);
  } catch {
    return false;
  }
}

// ─── Violation Tracking (auto-block after repeated violations) ──────────────
async function trackViolation(identifier, blockDurationMin) {
  try {
    if (getConnectionStatus()) {
      const redis = getClient();
      const violationKey = `ratelimit:violations:${identifier}`;
      const count = await redis.incr(violationKey);
      await redis.expire(violationKey, 300);

      // Auto-block after 5 violations in 5 minutes
      if (count >= 5) {
        await blockUser(identifier, blockDurationMin);
        await redis.del(violationKey);
        return true;
      }
      return false;
    }

    const { ViolationStore } = require("../services/memoryStore");
    const count = ViolationStore.increment(identifier);
    if (count >= 5) {
      await blockUser(identifier, blockDurationMin);
      ViolationStore.reset(identifier);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

// ─── Request Logger ─────────────────────────────────────────────────────────
/**
 * Fire-and-forget log to MongoDB (or in-memory) + emit via Socket.io.
 * Never blocks the response.
 */
function logRequest(req, statusCode, blocked, algorithm) {
  const logEntry = {
    ip: getClientIP(req),
    userId: req.userId || null,
    method: req.method,
    route: req.originalUrl,
    status: statusCode,
    latency: Date.now() - (req._startTime || Date.now()),
    algorithm,
    blocked,
    apiKey: req.apiKey || null,
    userAgent: req.headers["user-agent"] || null,
    timestamp: new Date(),
  };

  // Persist to the appropriate store (non-blocking)
  if (getMongoStatus()) {
    const RequestLog = require("../models/RequestLog");
    RequestLog.create(logEntry).catch(() => {});
  } else {
    const { RequestLogStore } = require("../services/memoryStore");
    RequestLogStore.create(logEntry).catch(() => {});
  }

  // Emit to Socket.io if available
  const io = req.app.get("io");
  if (io) {
    io.emit("new-request", logEntry);
  }
}

// ─── Main Middleware Factory ────────────────────────────────────────────────
/**
 * Returns an Express middleware that applies rate limiting.
 *
 * @param {Object} options
 * @param {"token-bucket"|"sliding-window"} options.algorithm
 * @param {number} options.limit         – max requests per window
 * @param {number} options.windowSec     – window size in seconds
 * @param {number} options.blockDuration – auto-block duration in minutes
 */
function createRateLimiter(options = {}) {
  const {
    algorithm = process.env.ALGORITHM || "sliding-window",
    limit = parseInt(process.env.DEFAULT_RATE_LIMIT, 10) || 100,
    windowSec = parseInt(process.env.DEFAULT_WINDOW_SECONDS, 10) || 60,
    blockDuration = parseInt(process.env.BLOCK_DURATION_MINUTES, 10) || 10,
  } = options;

  const refillRate = limit / windowSec;

  return async (req, res, next) => {
    req._startTime = Date.now();

    const identifier = getIdentifier(req);

    // 1. Check if user is blocked
    const blockedTTL = await isBlocked(identifier);
    if (blockedTTL) {
      res.set({
        "X-RateLimit-Limit": 0,
        "X-RateLimit-Remaining": 0,
        "X-RateLimit-Reset": Math.ceil(Date.now() / 1000) + blockedTTL,
        "Retry-After": blockedTTL,
      });

      logRequest(req, 429, true, algorithm);
      return res.status(429).json({
        success: false,
        error: "Too Many Requests",
        data: null,
        message: `You are temporarily blocked. Try again in ${blockedTTL} seconds.`,
        retryAfter: blockedTTL,
        blocked: true,
      });
    }

    // 2. Determine plan-based rate limit
    const tier = req.apiKeyTier || "free";
    const plan = PLANS[tier] || PLANS.free;
    const effectiveLimit = plan.limit === Infinity ? Infinity : (plan.limit || limit);

    // Enterprise gets unlimited
    if (effectiveLimit === Infinity) {
      res.on("finish", () => {
        logRequest(req, res.statusCode, false, algorithm);
      });
      return next();
    }

    // 3. Apply rate-limit algorithm
    let result;
    try {
      if (!getConnectionStatus()) {
        result = slidingWindowMemory(identifier, effectiveLimit, windowSec);
      } else if (algorithm === "token-bucket") {
        result = await tokenBucket(
          identifier,
          effectiveLimit,
          refillRate,
          windowSec
        );
      } else {
        result = await slidingWindow(identifier, effectiveLimit, windowSec);
      }
    } catch (err) {
      // Redis command failed — fail open with warning log
      console.error("Rate limiter Redis error, using fallback:", err.message);
      result = slidingWindowMemory(identifier, effectiveLimit, windowSec);
    }

    // 4. Set standard rate-limit headers
    res.set({
      "X-RateLimit-Limit": effectiveLimit,
      "X-RateLimit-Remaining": result.remaining,
      "X-RateLimit-Algorithm": algorithm,
      "X-RateLimit-Reset": Math.ceil(Date.now() / 1000) + windowSec,
    });

    // 5. If not allowed → track violation, maybe block
    if (!result.allowed) {
      res.set("Retry-After", result.retryAfter);

      const wasBlocked = await trackViolation(identifier, blockDuration);
      logRequest(req, 429, wasBlocked, algorithm);

      // Emit alert via Socket.io
      const io = req.app.get("io");
      if (io) {
        io.emit("alert", {
          type: wasBlocked ? "block" : "spike",
          message: wasBlocked
            ? `${identifier} has been blocked for ${blockDuration} minutes`
            : `${identifier} exceeded rate limit`,
          ip: identifier,
          timestamp: new Date(),
        });
      }

      return res.status(429).json({
        success: false,
        error: "Too Many Requests",
        data: null,
        message: wasBlocked
          ? `You have been blocked for ${blockDuration} minutes due to repeated violations.`
          : `Rate limit exceeded. Try again in ${result.retryAfter} seconds.`,
        retryAfter: result.retryAfter,
        blocked: wasBlocked,
      });
    }

    // 6. Allowed — log and continue
    res.on("finish", () => {
      logRequest(req, res.statusCode, false, algorithm);
    });

    next();
  };
}

module.exports = {
  createRateLimiter,
  blockUser,
  isBlocked,
  getClientIP,
  getIdentifier,
  PLANS,
};
