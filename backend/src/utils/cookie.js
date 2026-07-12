const env = require("../config/env");

/**
 * Standard configuration options for authentication JWT cookies.
 * Enforces security controls depending on active NODE_ENV.
 */
const cookieOptions = {
  httpOnly: true, // Prevents client-side scripts (XSS) from reading the cookie
  secure: env.nodeEnv === "production", // Transmit only over HTTPS in production
  sameSite: env.nodeEnv === "production" ? "none" : "lax", // Prevent CSRF attacks
  maxAge: 7 * 24 * 60 * 60 * 1000, // Cookie expiration time (7 days, matching JWT)
};

module.exports = {
  cookieOptions,
};
