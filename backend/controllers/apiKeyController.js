const { v4: uuidv4 } = require("uuid");
const ApiKey = require("../models/ApiKey");

/**
 * POST /api/keys
 * Generate a new API key.
 */
async function createKey(req, res) {
  try {
    const { name, userId, tier } = req.body;

    if (!name || !userId) {
      return res.status(400).json({ error: "name and userId are required" });
    }

    const key = `rg_${tier === "pro" ? "pro" : "free"}_${uuidv4().replace(/-/g, "")}`;

    const apiKey = await ApiKey.create({
      key,
      name,
      userId,
      tier: tier || "free",
    });

    res.status(201).json({
      message: "API key created",
      apiKey: {
        id: apiKey._id,
        key: apiKey.key,
        name: apiKey.name,
        tier: apiKey.tier,
        userId: apiKey.userId,
      },
    });
  } catch (err) {
    console.error("Create key error:", err);
    res.status(500).json({ error: "Failed to create API key" });
  }
}

/**
 * GET /api/keys
 * List all API keys.
 */
async function listKeys(req, res) {
  try {
    const keys = await ApiKey.find()
      .select("-__v")
      .sort({ createdAt: -1 });
    res.json(keys);
  } catch (err) {
    console.error("List keys error:", err);
    res.status(500).json({ error: "Failed to list API keys" });
  }
}

/**
 * DELETE /api/keys/:id
 * Deactivate an API key.
 */
async function revokeKey(req, res) {
  try {
    const key = await ApiKey.findByIdAndUpdate(
      req.params.id,
      { active: false },
      { new: true }
    );

    if (!key) {
      return res.status(404).json({ error: "API key not found" });
    }

    res.json({ message: "API key revoked", key });
  } catch (err) {
    console.error("Revoke key error:", err);
    res.status(500).json({ error: "Failed to revoke API key" });
  }
}

module.exports = { createKey, listKeys, revokeKey };
