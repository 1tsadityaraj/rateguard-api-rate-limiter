const { v4: uuidv4 } = require("uuid");
const bcrypt = require("bcryptjs");
const { getMongoStatus } = require("../config/db");

/**
 * POST /api/keys/generate
 * Generate a new API key.
 */
async function generateKey(req, res) {
  try {
    const { name, userId, tier } = req.body;

    if (!name || !userId) {
      return res
        .status(400)
        .json({ success: false, data: null, error: "name and userId are required" });
    }

    const validTiers = ["free", "pro", "enterprise"];
    const keyTier = validTiers.includes(tier) ? tier : "free";

    // Generate key with tier prefix
    const rawKey = `rg_${keyTier}_${uuidv4().replace(/-/g, "")}`;

    let apiKey;

    if (getMongoStatus()) {
      const ApiKey = require("../models/ApiKey");
      apiKey = await ApiKey.create({
        key: rawKey,
        name,
        userId,
        tier: keyTier,
      });
    } else {
      const { ApiKeyStore } = require("../services/memoryStore");
      apiKey = await ApiKeyStore.create({
        key: rawKey,
        name,
        userId,
        tier: keyTier,
      });
    }

    res.status(201).json({
      success: true,
      data: {
        id: apiKey._id,
        key: apiKey.key,
        name: apiKey.name,
        tier: apiKey.tier,
        userId: apiKey.userId,
      },
      error: null,
    });
  } catch (err) {
    console.error("Create key error:", err);
    res.status(500).json({ success: false, data: null, error: "Failed to create API key" });
  }
}

/**
 * GET /api/keys
 * List all API keys.
 */
async function listKeys(req, res) {
  try {
    let keys;

    if (getMongoStatus()) {
      const ApiKey = require("../models/ApiKey");
      keys = await ApiKey.find().select("-__v").sort({ createdAt: -1 });
    } else {
      const { ApiKeyStore } = require("../services/memoryStore");
      keys = await ApiKeyStore.findSorted();
    }

    res.json({ success: true, data: keys, error: null });
  } catch (err) {
    console.error("List keys error:", err);
    res.status(500).json({ success: false, data: null, error: "Failed to list API keys" });
  }
}

/**
 * DELETE /api/keys/:id
 * Revoke (deactivate) an API key.
 */
async function revokeKey(req, res) {
  try {
    let key;

    if (getMongoStatus()) {
      const ApiKey = require("../models/ApiKey");
      key = await ApiKey.findByIdAndUpdate(
        req.params.id,
        { active: false },
        { new: true }
      );
    } else {
      const { ApiKeyStore } = require("../services/memoryStore");
      key = await ApiKeyStore.findByIdAndUpdate(req.params.id, {
        active: false,
      });
    }

    if (!key) {
      return res
        .status(404)
        .json({ success: false, data: null, error: "API key not found" });
    }

    res.json({ success: true, data: key, error: null });
  } catch (err) {
    console.error("Revoke key error:", err);
    res.status(500).json({ success: false, data: null, error: "Failed to revoke API key" });
  }
}

module.exports = { generateKey, listKeys, revokeKey };
