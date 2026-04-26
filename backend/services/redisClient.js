const Redis = require("ioredis");

/**
 * Redis client singleton with automatic reconnection.
 * Used for rate-limit counters, blocked-user lists, and pub/sub.
 *
 * When NO_DB=true or Redis is unreachable, provides a disconnected
 * status so the app falls back to in-memory rate limiting.
 */

let client;
let isConnected = false;

const createClient = () => {
  if (client) return client;

  // Skip Redis entirely in memory-only mode
  if (process.env.NO_DB === "true") {
    console.log("⚡ Redis skipped (memory-only mode)");
    client = {
      _stub: true,
      on: () => {},
      get: async () => null,
      set: async () => "OK",
      del: async () => 1,
      keys: async () => [],
      ttl: async () => -2,
      incr: async () => 1,
      expire: async () => 1,
      eval: async () => [1, 99, 0],
      zadd: async () => 1,
      zcard: async () => 0,
      zrange: async () => [],
      zremrangebyscore: async () => 0,
    };
    return client;
  }

  const redisUrl = process.env.REDIS_URL;

  const options = {
    ...(redisUrl
      ? {} // ioredis parses the URL automatically
      : {
          host: process.env.REDIS_HOST || "127.0.0.1",
          port: parseInt(process.env.REDIS_PORT, 10) || 6379,
        }),
    retryStrategy: (times) => {
      if (times > 10) {
        console.error("❌ Redis: max reconnection attempts reached");
        return null;
      }
      return Math.min(times * 200, 5000);
    },
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    lazyConnect: false,
  };

  if (process.env.REDIS_PASSWORD) {
    options.password = process.env.REDIS_PASSWORD;
  }

  client = redisUrl ? new Redis(redisUrl, options) : new Redis(options);

  client.on("connect", () => {
    isConnected = true;
    console.log("✅ Redis connected");
  });

  client.on("error", (err) => {
    isConnected = false;
    console.error(`❌ Redis error: ${err.message}`);
  });

  client.on("close", () => {
    isConnected = false;
    console.warn("⚠️  Redis connection closed");
  });

  return client;
};

/**
 * Check if Redis is currently connected.
 * Used by middleware to decide whether to fall back to in-memory limiting.
 */
const getConnectionStatus = () => isConnected;

module.exports = {
  getClient: createClient,
  getConnectionStatus,
};
