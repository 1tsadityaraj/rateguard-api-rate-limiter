const mongoose = require("mongoose");

/**
 * API Key model — supports tiered rate limiting (Free / Pro).
 * Each key maps to a userId and a tier that determines its rate limit.
 */
const apiKeySchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    tier: {
      type: String,
      enum: ["free", "pro"],
      default: "free",
    },
    active: {
      type: Boolean,
      default: true,
    },
    requestCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.model("ApiKey", apiKeySchema);
