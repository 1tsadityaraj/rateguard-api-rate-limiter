const express = require("express");
const router = express.Router();
const {
  generateKey,
  listKeys,
  revokeKey,
} = require("../controllers/apiKeyController");

// API key management
router.post("/generate", generateKey);
router.get("/", listKeys);
router.delete("/:id", revokeKey);

module.exports = router;
