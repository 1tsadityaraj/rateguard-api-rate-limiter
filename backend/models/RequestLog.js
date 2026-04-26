const mongoose = require("mongoose");

/**
 * Stores every inbound API request for analytics and auditing.
 * TTL index auto-removes logs older than 30 days.
 */
const requestLogSchema = new mongoose.Schema(
  {
    ip: { type: String, required: true, index: true },
    userId: { type: String, default: null, index: true },
    route: { type: String, required: true },
    method: { type: String, required: true },
    status: { type: Number, default: 200 },
    latency: { type: Number, default: 0 },
    blocked: { type: Boolean, default: false },
    algorithm: {
      type: String,
      enum: ["token-bucket", "sliding-window"],
      default: "sliding-window",
    },
    apiKey: { type: String, default: null },
    userAgent: { type: String, default: null },
    timestamp: { type: Date, default: Date.now },
  },
  {
    timestamps: false,
    versionKey: false,
  }
);

// Auto-delete logs older than 30 days
requestLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 2592000 });

// Compound indexes for common dashboard queries
requestLogSchema.index({ ip: 1, timestamp: -1 });
requestLogSchema.index({ userId: 1, timestamp: -1 });
requestLogSchema.index({ blocked: 1, timestamp: -1 });

module.exports = mongoose.model("RequestLog", requestLogSchema);
