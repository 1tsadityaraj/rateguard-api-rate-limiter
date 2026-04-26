const jwt = require("jsonwebtoken");
const { getMongoStatus } = require("../config/db");

/**
 * JWT authentication middleware.
 * Attaches `req.user` on success.
 * Falls back to in-memory UserStore when MongoDB is unavailable.
 */
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ success: false, data: null, error: "Authentication required" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    let user;
    if (getMongoStatus()) {
      const User = require("../models/User");
      user = await User.findById(decoded.id);
    } else {
      const { UserStore } = require("../services/memoryStore");
      user = await UserStore.findById(decoded.id);
    }

    if (!user) {
      return res
        .status(401)
        .json({ success: false, data: null, error: "User not found" });
    }

    req.user = user;
    req.userId = user._id?.toString?.() || user._id;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res
        .status(401)
        .json({ success: false, data: null, error: "Token expired" });
    }
    return res
      .status(401)
      .json({ success: false, data: null, error: "Invalid token" });
  }
}

/**
 * Role-based access control middleware.
 */
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res
        .status(403)
        .json({ success: false, data: null, error: "Insufficient permissions" });
    }
    next();
  };
}

module.exports = { authenticate, authorize };
