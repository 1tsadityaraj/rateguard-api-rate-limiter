const { getClient, getConnectionStatus } = require("../services/redisClient");
const RequestLog = require("../models/RequestLog");

// ─── In-memory fallback when Redis is unavailable ───────────────────────────
const memoryStore = new Map();

/**
 * Clean up stale in-memory entries every 60 seconds
 * to prevent unbounded memory growth.
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of memoryStore) {
    if (data.expiresAt && data.expiresAt < now) {
      memoryStore.delete(key);
    }
  }
}, 60_000);

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Extract the real client IP, respecting common proxy headers.
 */
function getClientIP(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.ip || req.socket?.remoteAddress || "unknown";
}

/**
 * Derive a unique identifier: prefer userId (from JWT / API key),
 * fall back to IP address.
 */
function getIdentifier(req) {
  return req.userId || getClientIP(req);
}

// ─── Token Bucket Algorithm ─────────────────────────────────────────────────
/**
 * Classic token-bucket: tokens refill at a steady rate.
 * Each request consumes one token. When the bucket is empty → 429.
 *
 * Redis keys:
 *   rg:tb:{id}:tokens   – current token count
 *   rg:tb:{id}:last     – timestamp of last refill
 */
async function tokenBucket(identifier, maxTokens, refillRate, windowSec) {
  const redis = getClient();
  const tokensKey = `rg:tb:${identifier}:tokens`;
  const lastKey = `rg:tb:${identifier}:last`;

  // Lua script for atomic token-bucket check + consume
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

    -- Refill tokens based on elapsed time
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
 */
async function slidingWindow(identifier, limit, windowSec) {
  const redis = getClient();
  const key = `rg:sw:${identifier}`;

  const luaScript = `
    local key       = KEYS[1]
    local now       = tonumber(ARGV[1])
    local window    = tonumber(ARGV[2])
    local limit     = tonumber(ARGV[3])
    local member    = ARGV[4]

    local window_start = now - window

    -- Remove expired entries
    redis.call('ZREMRANGEBYSCORE', key, '-inf', window_start)

    -- Count current entries
    local count = redis.call('ZCARD', key)

    if count < limit then
      redis.call('ZADD', key, now, member)
      redis.call('EXPIRE', key, window + 1)
      return {1, limit - count - 1, 0}
    else
      -- Calculate when the oldest entry will expire
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
  // Prune expired timestamps
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
    if (!getConnectionStatus()) return false;
    const redis = getClient();
    const ttl = await redis.ttl(`rg:blocked:${identifier}`);
    return ttl > 0 ? ttl : false;
  } catch {
    return false;
  }
}

async function blockUser(identifier, durationMin) {
  try {
    const redis = getClient();
    const durationSec = durationMin * 60;
    await redis.set(`rg:blocked:${identifier}`, "1", "EX", durationSec);
    return true;
  } catch {
    return false;
  }
}

// ─── Violation Tracking (auto-block after repeated violations) ──────────────
async function trackViolation(identifier, blockDurationMin) {
  try {
    const redis = getClient();
    const violationKey = `rg:violations:${identifier}`;
    const count = await redis.incr(violationKey);
    await redis.expire(violationKey, 300); // 5-minute rolling window

    // Auto-block after 5 violations in 5 minutes
    if (count >= 5) {
      await blockUser(identifier, blockDurationMin);
      await redis.del(violationKey);
      return true; // user was auto-blocked
    }
    return false;
  } catch {
    return false;
  }
}

// ─── Request Logger ─────────────────────────────────────────────────────────
/**
 * Fire-and-forget log to MongoDB + emit via Socket.io.
 * Never blocks the response.
 */
function logRequest(req, statusCode, blocked, algorithm) {
  const logEntry = {
    ip: getClientIP(req),
    userId: req.userId || null,
    method: req.method,
    path: req.originalUrl,
    statusCode,
    algorithm,
    blocked,
    apiKey: req.apiKey || null,
    userAgent: req.headers["user-agent"] || null,
    responseTime: Date.now() - (req._startTime || Date.now()),
    timestamp: new Date(),
  };

  // Persist to MongoDB (non-blocking)
  RequestLog.create(logEntry).catch(() => {
    /* swallow — we don't crash for logging failures */
  });

  // Emit to Socket.io if available
  if (req.app.get("io")) {
    req.app.get("io").emit("request-log", logEntry);
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
    algorithm = "sliding-window",
    limit = parseInt(process.env.DEFAULT_RATE_LIMIT, 10) || 100,
    windowSec = parseInt(process.env.DEFAULT_WINDOW_SECONDS, 10) || 60,
    blockDuration = parseInt(process.env.BLOCK_DURATION_MINUTES, 10) || 10,
  } = options;

  // Token bucket refill rate: refill to full capacity over one window
  const refillRate = limit / windowSec;

  return async (req, res, next) => {
    req._startTime = Date.now();

    const identifier = getIdentifier(req);

    // ── 1. Check if user is blocked ──
    const blockedTTL = await isBlocked(identifier);
    if (blockedTTL) {
      logRequest(req, 429, true, algorithm);
      return res.status(429).json({
        error: "Too Many Requests",
        message: `You are temporarily blocked. Try again in ${blockedTTL} seconds.`,
        retryAfter: blockedTTL,
        blocked: true,
      });
    }

    // ── 2. Determine rate limit (tier-aware) ──
    let effectiveLimit = limit;
    if (req.apiKeyTier === "pro") {
      effectiveLimit = parseInt(process.env.PRO_TIER_LIMIT, 10) || 200;
    } else if (req.apiKeyTier === "free") {
      effectiveLimit = parseInt(process.env.FREE_TIER_LIMIT, 10) || 30;
    }

    // ── 3. Apply rate-limit algorithm ──
    let result;
    try {
      if (!getConnectionStatus()) {
        // Redis is down — use in-memory fallback
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
      // Redis command failed — fall back to memory
      console.error("Rate limiter Redis error, using fallback:", err.message);
      result = slidingWindowMemory(identifier, effectiveLimit, windowSec);
    }

    // ── 4. Set standard rate-limit headers ──
    res.set({
      "X-RateLimit-Limit": effectiveLimit,
      "X-RateLimit-Remaining": result.remaining,
      "X-RateLimit-Algorithm": algorithm,
      "X-RateLimit-Reset": Math.ceil(Date.now() / 1000) + windowSec,
    });

    // ── 5. If not allowed → track violation, maybe block ──
    if (!result.allowed) {
      res.set("Retry-After", result.retryAfter);

      const wasBlocked = await trackViolation(identifier, blockDuration);
      logRequest(req, 429, wasBlocked, algorithm);

      return res.status(429).json({
        error: "Too Many Requests",
        message: wasBlocked
          ? `You have been blocked for ${blockDuration} minutes due to repeated violations.`
          : `Rate limit exceeded. Try again in ${result.retryAfter} seconds.`,
        retryAfter: result.retryAfter,
        blocked: wasBlocked,
      });
    }

    // ── 6. Allowed — log and continue ──
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
};
