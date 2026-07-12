const jwt = require("jsonwebtoken");
const User = require("../models/User");
const env = require("../config/env");

/**
 * Middleware to verify JSON Web Token from Cookies or Authorization Header.
 * Rejects deactivated, pending, or suspended accounts.
 */
const verifyJWT = async (req, res, next) => {
  try {
    let token = null;

    // 1. Check signed cookies (highly secure, tamper-proof option)
    if (req.signedCookies && req.signedCookies.token) {
      token = req.signedCookies.token;
    }
    // 2. Check standard cookie
    else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }
    // 3. Check Authorization header (Bearer token pattern)
    else if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer ")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. Please log in to proceed.",
      });
    }

    // Verify token payload
    const decoded = jwt.verify(token, env.jwtSecret);

    // Retrieve user and ensure they still exist in the database
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User session is invalid. User no longer exists.",
      });
    }

    // Enforce account status check: Only "Active" users are authorized to use the platform.
    if (user.status !== "Active") {
      return res.status(403).json({
        success: false,
        message: `Access denied. Your account status is currently ${user.status.toLowerCase()}.`,
      });
    }

    // Append authenticated user object to the request context
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Session expired or token is invalid. Please log in again.",
    });
  }
};

/**
 * Middleware to authorize specific user roles.
 * Must be executed after verifyJWT.
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized. You do not have permissions to perform this action.",
      });
    }

    next();
  };
};

/**
 * Middleware to check if a password change is forced (first login flow).
 * Block access to application APIs until password is set.
 */
const requirePasswordChange = (req, res, next) => {
  if (req.user && req.user.isPasswordChangeRequired) {
    return res.status(403).json({
      success: false,
      message: "Forced password change is required on your first login.",
      isPasswordChangeRequired: true,
    });
  }
  next();
};

module.exports = {
  verifyJWT,
  authorize,
  requirePasswordChange,
};
