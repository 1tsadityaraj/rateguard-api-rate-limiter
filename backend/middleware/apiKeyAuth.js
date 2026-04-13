const { getMongoStatus } = require("../config/db");

/**
 * API Key authentication middleware.
 * Looks for `x-api-key` header and resolves the tier (free/pro)
 * so the rate limiter can apply the correct limit.
 *
 * This is optional — requests without an API key still go through
 * with the default rate limit.
 */
async function apiKeyAuth(req, res, next) {
  const key = req.headers["x-api-key"];

  if (!key) {
    // No API key — use default limits
    return next();
  }

  try {
    let apiKey;

    if (getMongoStatus()) {
      const ApiKey = require("../models/ApiKey");
      apiKey = await ApiKey.findOne({ key, active: true });
    } else {
      const { ApiKeyStore } = require("../services/memoryStore");
      apiKey = await ApiKeyStore.findOne({ key, active: true });
    }

    if (!apiKey) {
      return res.status(401).json({ error: "Invalid or inactive API key" });
    }

    // Attach tier and userId to the request
    req.apiKey = apiKey.key;
    req.apiKeyTier = apiKey.tier;
    req.userId = apiKey.userId;

    // Increment usage counter (fire-and-forget)
    if (getMongoStatus()) {
      const ApiKey = require("../models/ApiKey");
      ApiKey.updateOne({ _id: apiKey._id }, { $inc: { requestCount: 1 } }).catch(
        () => {}
      );
    } else {
      const { ApiKeyStore } = require("../services/memoryStore");
      ApiKeyStore.findByIdAndUpdate(apiKey._id, { $inc: { requestCount: 1 } }).catch(
        () => {}
      );
    }

    next();
  } catch (err) {
    // On DB failure, allow request with default limits
    console.error("API key auth error:", err.message);
    next();
  }
}

module.exports = apiKeyAuth;
