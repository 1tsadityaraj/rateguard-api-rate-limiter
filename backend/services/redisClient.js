const Redis = require("ioredis");

/**
 * Redis client singleton with automatic reconnection.
 * Used for rate-limit counters, blocked-user lists, and pub/sub.
 */

let client;
let isConnected = false;

const createClient = () => {
  if (client) return client;

  const options = {
    host: process.env.REDIS_HOST || "127.0.0.1",
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    retryStrategy: (times) => {
      if (times > 10) {
        console.error("❌ Redis: max reconnection attempts reached");
        return null; // stop retrying
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

  client = new Redis(options);

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
