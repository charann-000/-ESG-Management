const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController");
const authValidation = require("../validations/authValidation");
const {
  verifyJWT,
  requirePasswordChange,
} = require("../middleware/authMiddleware");

// --- Public Endpoints ---

// POST /auth/login - User authentication
/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: User login and session management
 */

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Log in to the application
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successfully logged in
 *       400:
 *         description: Validation Error
 *       401:
 *         description: Invalid credentials
 */
router.post(
  "/login",
  authValidation.loginValidation,
  authController.login
);

// POST /auth/forgot-password - Trigger stateless reset token email
router.post(
  "/forgot-password",
  authValidation.forgotPasswordValidation,
  authController.forgotPassword
);

// POST /auth/reset-password - Set new password via recovery token
router.post(
  "/reset-password",
  authValidation.resetPasswordValidation,
  authController.resetPassword
);

// --- Protected Endpoints ---

// POST /auth/logout - Terminate session cookie & audit
router.post(
  "/logout",
  verifyJWT,
  authController.logout
);

// POST /auth/change-password - Change password (forces requirement clear)
// Note: This endpoint is accessible when isPasswordChangeRequired = true,
// enabling the user to resolve the change requirement.
router.post(
  "/change-password",
  verifyJWT,
  authValidation.changePasswordValidation,
  authController.changePassword
);

// GET /auth/me - Retrieve current authenticated profile
// Note: Enforces requirePasswordChange. If password change is required,
// access to user info is blocked until resolved.
router.get(
  "/me",
  verifyJWT,
  requirePasswordChange,
  authController.getCurrentUser
);

module.exports = router;
