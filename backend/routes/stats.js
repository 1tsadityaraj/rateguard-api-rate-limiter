const express = require("express");
const router = express.Router();
const {
  getStats,
  getTopUsers,
  getBlockedUsers,
  healthCheck,
  getLogs,
  exportLogs,
  getAlerts,
} = require("../controllers/statsController");

// Public
router.get("/health", healthCheck);

// Dashboard data
router.get("/stats", getStats);
router.get("/top-users", getTopUsers);
router.get("/blocked-users", getBlockedUsers);
router.get("/alerts", getAlerts);
router.get("/logs", getLogs);

// Export
router.get("/logs/export", exportLogs);

module.exports = router;
