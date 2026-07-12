const jwt = require("jsonwebtoken");
const User = require("../models/User");
const AuditLog = require("../models/AuditLog");
const env = require("../config/env");
const { generateToken } = require("../utils/helpers");
const {
  sendWelcomeEmail,
  sendForgotPasswordEmail,
  sendPasswordChangedEmail,
} = require("../utils/emailService");

/**
 * Creates an immutable AuditLog entry in the database.
 */
const createAuditLog = async ({
  action,
  actor,
  actorRole,
  targetModel,
  targetId,
  changes = {},
  ipAddress,
  userAgent,
}) => {
  try {
    await AuditLog.create({
      action,
      actor,
      actorRole,
      targetModel,
      targetId,
      changes,
      ipAddress,
      userAgent,
    });
  } catch (error) {
    console.error("⚠️ Failed to record audit log entry:", error.message);
  }
};

/**
 * Service to handle User Login authentication.
 */
const login = async (email, password, ipAddress, userAgent) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new Error("Invalid email or password");
  }

  // Check account status. Only "Active" users can log in.
  if (user.status !== "Active") {
    throw new Error(
      `Your account is currently ${user.status.toLowerCase()}. Access denied.`
    );
  }

  // Validate password
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new Error("Invalid email or password");
  }

  // Generate Session Token
  const token = generateToken(user._id);

  // Record successful login audit event
  await createAuditLog({
    action: "LOGIN",
    actor: user._id,
    actorRole: user.role,
    targetModel: "User",
    targetId: user._id,
    changes: { status: "SUCCESS" },
    ipAddress,
    userAgent,
  });

  return {
    token,
    user: {
      role: user.role,
      isPasswordChangeRequired: user.isPasswordChangeRequired,
    },
  };
};

/**
 * Service to handle User Logout auditing.
 */
const logout = async (user, ipAddress, userAgent) => {
  // Record logout audit event (mapped to UPDATE action inside the immutable AuditLog schema)
  await createAuditLog({
    action: "UPDATE",
    actor: user._id,
    actorRole: user.role,
    targetModel: "User",
    targetId: user._id,
    changes: { event: "LOGOUT" },
    ipAddress,
    userAgent,
  });
};

/**
 * Service to handle Password Change.
 */
const changePassword = async (user, oldPassword, newPassword, ipAddress, userAgent) => {
  // Confirm old password matches
  const isMatch = await user.comparePassword(oldPassword);
  if (!isMatch) {
    throw new Error("Old password does not match");
  }

  // Update password (hash is generated automatically by the User pre-save hook)
  user.password = newPassword;
  user.isPasswordChangeRequired = false;
  await user.save();

  // Send password change notification email
  try {
    await sendPasswordChangedEmail(user.email, user.name);
  } catch (error) {
    console.error("⚠️ Failed to dispatch password change email notification:", error.message);
  }

  // Record password change audit event
  await createAuditLog({
    action: "PASSWORD_CHANGE",
    actor: user._id,
    actorRole: user.role,
    targetModel: "User",
    targetId: user._id,
    changes: { event: "PASSWORD_CHANGE" },
    ipAddress,
    userAgent,
  });

  return true;
};

/**
 * Service to request a Password Reset Token.
 * Implements stateless tokens relying on user.password hash.
 */
const forgotPassword = async (email, ipAddress, userAgent) => {
  const user = await User.findOne({ email });
  
  // Prevent email enumeration: do not throw error if user is not found,
  // but silently skip email generation.
  if (!user) {
    return true;
  }

  // Check account status. Non-active accounts cannot request reset links.
  if (user.status !== "Active") {
    return true;
  }

  // Create a stateless token. Incorporate current hashed password in the secret key.
  // If the user's password changes, the secret changes, invalidating this token.
  const resetSecret = env.jwtSecret + user.password;
  const resetToken = jwt.sign({ id: user._id }, resetSecret, {
    expiresIn: "15m",
  });

  const resetUrl = `${env.frontendUrl}/reset-password?token=${resetToken}`;

  // Dispatch recovery email
  await sendForgotPasswordEmail(user.email, user.name, resetUrl);

  // Record recovery request audit event (mapped to UPDATE action)
  await createAuditLog({
    action: "UPDATE",
    actor: user._id,
    actorRole: user.role,
    targetModel: "User",
    targetId: user._id,
    changes: { event: "FORGOT_PASSWORD_REQUEST" },
    ipAddress,
    userAgent,
  });

  return true;
};

/**
 * Service to Reset password using recovery token.
 */
const resetPassword = async (token, newPassword, ipAddress, userAgent) => {
  // Decode JWT payload first without verification to find user ID
  let decoded;
  try {
    decoded = jwt.decode(token);
    if (!decoded || !decoded.id) {
      throw new Error("Invalid or corrupted recovery link.");
    }
  } catch (err) {
    throw new Error("Invalid or corrupted recovery link.");
  }

  const user = await User.findById(decoded.id);
  if (!user) {
    throw new Error("User associated with this recovery link no longer exists.");
  }

  // Verify token signature against the user-specific stateless secret
  const resetSecret = env.jwtSecret + user.password;
  try {
    jwt.verify(token, resetSecret);
  } catch (err) {
    throw new Error("Recovery link is invalid or has expired.");
  }

  // Register new password
  user.password = newPassword;
  user.isPasswordChangeRequired = false;
  await user.save();

  // Send update confirmation email
  try {
    await sendPasswordChangedEmail(user.email, user.name);
  } catch (error) {
    console.error("⚠️ Failed to dispatch reset confirmation email:", error.message);
  }

  // Record password reset audit event
  await createAuditLog({
    action: "PASSWORD_CHANGE",
    actor: user._id,
    actorRole: user.role,
    targetModel: "User",
    targetId: user._id,
    changes: { event: "PASSWORD_RESET" },
    ipAddress,
    userAgent,
  });

  return true;
};

/**
 * Service to fetch user profile details safely.
 */
const getCurrentUser = async (userId) => {
  const user = await User.findById(userId).select("-password");
  if (!user) {
    throw new Error("User not found");
  }
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
  };
};

module.exports = {
  login,
  logout,
  changePassword,
  forgotPassword,
  resetPassword,
  getCurrentUser,
};
