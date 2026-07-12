const authService = require("../services/authService");
const { cookieOptions } = require("../utils/cookie");

/**
 * Controller to handle POST /auth/login.
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const ipAddress = req.ip || req.headers["x-forwarded-for"] || null;
    const userAgent = req.headers["user-agent"] || null;

    const result = await authService.login(email, password, ipAddress, userAgent);

    // Set signed JWT inside browser HttpOnly cookie
    res.cookie("token", result.token, cookieOptions);

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      data: result.user,
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: error.message || "Invalid credentials.",
      errors: [],
    });
  }
};

/**
 * Controller to handle POST /auth/logout.
 */
const logout = async (req, res) => {
  try {
    const ipAddress = req.ip || req.headers["x-forwarded-for"] || null;
    const userAgent = req.headers["user-agent"] || null;

    // Log the event if session user context exists
    if (req.user) {
      await authService.logout(req.user, ipAddress, userAgent);
    }

    // Clear JWT cookie from user browser
    res.clearCookie("token", { ...cookieOptions, maxAge: 0 });

    return res.status(200).json({
      success: true,
      message: "Logout successful.",
      data: {},
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || "Logout failed.",
      errors: [],
    });
  }
};

/**
 * Controller to handle POST /auth/change-password.
 */
const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const ipAddress = req.ip || req.headers["x-forwarded-for"] || null;
    const userAgent = req.headers["user-agent"] || null;

    await authService.changePassword(
      req.user,
      oldPassword,
      newPassword,
      ipAddress,
      userAgent
    );

    return res.status(200).json({
      success: true,
      message: "Password changed successfully.",
      data: {},
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to change password.",
      errors: [],
    });
  }
};

/**
 * Controller to handle POST /auth/forgot-password.
 */
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const ipAddress = req.ip || req.headers["x-forwarded-for"] || null;
    const userAgent = req.headers["user-agent"] || null;

    await authService.forgotPassword(email, ipAddress, userAgent);

    // Prevent security disclosure of registered emails
    return res.status(200).json({
      success: true,
      message: "Password reset instructions have been sent to your email if the account exists.",
      data: {},
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to process recovery request.",
      errors: [],
    });
  }
};

/**
 * Controller to handle POST /auth/reset-password.
 */
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    const ipAddress = req.ip || req.headers["x-forwarded-for"] || null;
    const userAgent = req.headers["user-agent"] || null;

    await authService.resetPassword(token, newPassword, ipAddress, userAgent);

    return res.status(200).json({
      success: true,
      message: "Password has been reset successfully.",
      data: {},
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to reset password.",
      errors: [],
    });
  }
};

/**
 * Controller to handle GET /auth/me.
 */
const getCurrentUser = async (req, res) => {
  try {
    const userData = await authService.getCurrentUser(req.user._id);

    return res.status(200).json({
      success: true,
      message: "Current user retrieved successfully.",
      data: userData,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error.message || "User profile not found.",
      errors: [],
    });
  }
};

module.exports = {
  login,
  logout,
  changePassword,
  forgotPassword,
  resetPassword,
  getCurrentUser,
};
