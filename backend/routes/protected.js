const express = require("express");
const router = express.Router();

/**
 * Sample protected API routes to demonstrate rate limiting.
 * These routes simulate a real API behind the rate limiter.
 */

router.get("/data", (req, res) => {
  res.json({
    success: true,
    data: {
      message: "Here is your data",
      timestamp: new Date(),
      requestId: Math.random().toString(36).slice(2),
    },
    error: null,
  });
});

router.post("/data", (req, res) => {
  res.status(201).json({
    success: true,
    data: {
      message: "Data created",
      body: req.body,
      timestamp: new Date(),
    },
    error: null,
  });
});

router.get("/users", (req, res) => {
  const users = Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    name: `User ${i + 1}`,
    email: `user${i + 1}@example.com`,
  }));
  res.json({ success: true, data: users, error: null });
});

router.get("/products", (req, res) => {
  const products = Array.from({ length: 5 }, (_, i) => ({
    id: i + 1,
    name: `Product ${i + 1}`,
    price: (Math.random() * 100).toFixed(2),
  }));
  res.json({ success: true, data: products, error: null });
});

module.exports = router;
