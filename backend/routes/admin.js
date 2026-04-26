const express = require("express");
const router = express.Router();
const { manualBlock, unblockUser } = require("../controllers/statsController");

// Admin actions
router.post("/block", manualBlock);
router.post("/unblock", unblockUser);

module.exports = router;
