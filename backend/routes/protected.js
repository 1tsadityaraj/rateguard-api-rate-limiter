const express = require("express");
const router = express.Router();

/**
 * Sample protected API routes to demonstrate rate limiting.
 * These routes simulate a real API that would be behind the rate limiter.
 */

router.get("/data", (req, res) => {
  res.json({
    message: "Here is your data",
    timestamp: new Date(),
    requestId: Math.random().toString(36).slice(2),
  });
});

router.post("/data", (req, res) => {
  res.status(201).json({
    message: "Data created",
    data: req.body,
    timestamp: new Date(),
  });
});

router.get("/users", (req, res) => {
  const users = Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    name: `User ${i + 1}`,
    email: `user${i + 1}@example.com`,
  }));
  res.json(users);
});

router.get("/products", (req, res) => {
  const products = Array.from({ length: 5 }, (_, i) => ({
    id: i + 1,
    name: `Product ${i + 1}`,
    price: (Math.random() * 100).toFixed(2),
  }));
  res.json(products);
});

module.exports = router;
