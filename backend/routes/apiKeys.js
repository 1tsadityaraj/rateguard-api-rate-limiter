const express = require("express");
const router = express.Router();
const {
  createKey,
  listKeys,
  revokeKey,
} = require("../controllers/apiKeyController");
const { authenticate } = require("../middleware/auth");

// All API key routes require authentication
router.use(authenticate);

router.post("/", createKey);
router.get("/", listKeys);
router.delete("/:id", revokeKey);

module.exports = router;
