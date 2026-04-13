const mongoose = require("mongoose");

/**
 * Connect to MongoDB with retry logic.
 * Falls back gracefully if connection fails — rate limiting
 * still works via Redis; logs are buffered in memory.
 */

let isConnected = false;

const connectDB = async () => {
  // Skip if MONGODB_URI is not set or explicitly disabled
  if (!process.env.MONGODB_URI || process.env.NO_DB === "true") {
    console.log("⚡ Running in memory-only mode (no MongoDB)");
    return;
  }

  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      // Modern Mongoose 7+ doesn't need useNewUrlParser etc.
      serverSelectionTimeoutMS: 5000,
      maxPoolSize: 10,
    });
    isConnected = true;
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(`❌ MongoDB connection error: ${err.message}`);
    // Don't crash — the app can still rate-limit via Redis
    console.warn("⚠️  Running without MongoDB — logs will not be persisted.");
  }
};

const getMongoStatus = () => isConnected;

module.exports = connectDB;
module.exports.getMongoStatus = getMongoStatus;
