const jwt = require("jsonwebtoken");
const { getMongoStatus } = require("../config/db");

/**
 * POST /api/auth/register
 * Register a new admin user.
 */
async function register(req, res) {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res
        .status(400)
        .json({ error: "username, email, and password are required" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ error: "Password must be at least 6 characters" });
    }

    let user;

    if (getMongoStatus()) {
      const User = require("../models/User");

      // Check if user already exists
      const existing = await User.findOne({
        $or: [{ email }, { username }],
      });

      if (existing) {
        return res
          .status(409)
          .json({ error: "User with that email or username already exists" });
      }

      user = await User.create({ username, email, password });
    } else {
      const { UserStore } = require("../services/memoryStore");

      // Check if user already exists
      const existing = await UserStore.findOne({
        $or: [{ email }, { username }],
      });

      if (existing) {
        return res
          .status(409)
          .json({ error: "User with that email or username already exists" });
      }

      user = await UserStore.create({ username, email, password });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );

    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Registration failed" });
  }
}

/**
 * POST /api/auth/login
 * Authenticate and return JWT.
 */
async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ error: "email and password are required" });
    }

    let user;

    if (getMongoStatus()) {
      const User = require("../models/User");
      user = await User.findOne({ email }).select("+password");
    } else {
      const { UserStore } = require("../services/memoryStore");
      user = await UserStore.findOne({ email });
    }

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Login failed" });
  }
}

/**
 * GET /api/auth/me
 * Get current user from token.
 */
async function getMe(req, res) {
  res.json({
    user: {
      id: req.user._id,
      username: req.user.username,
      email: req.user.email,
      role: req.user.role,
    },
  });
}

module.exports = { register, login, getMe };
