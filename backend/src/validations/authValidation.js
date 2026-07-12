const { body, validationResult } = require("express-validator");

/**
 * Middleware to check validation results and return formatted errors.
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array().map((err) => ({
        field: err.path || err.param,
        message: err.msg,
      })),
    });
  }
  next();
};

/**
 * Validation rules for user login.
 */
const loginValidation = [
  body("email")
    .isEmail()
    .withMessage("Please enter a valid email address")
    .normalizeEmail(),
  body("password")
    .notEmpty()
    .withMessage("Password is required"),
  handleValidationErrors,
];

/**
 * Password strength constraints policy helper.
 */
const strongPasswordChain = (fieldName = "newPassword") => {
  return body(fieldName)
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters long")
    .matches(/[a-z]/)
    .withMessage("Password must contain at least one lowercase letter")
    .matches(/[A-Z]/)
    .withMessage("Password must contain at least one uppercase letter")
    .matches(/[0-9]/)
    .withMessage("Password must contain at least one number")
    .matches(/[!@#$%^&*(),.?":{}|<>]/)
    .withMessage("Password must contain at least one special character");
};

/**
 * Validation rules for password change.
 */
const changePasswordValidation = [
  body("oldPassword")
    .notEmpty()
    .withMessage("Old password is required"),
  strongPasswordChain("newPassword"),
  handleValidationErrors,
];

/**
 * Validation rules for forgot password request.
 */
const forgotPasswordValidation = [
  body("email")
    .isEmail()
    .withMessage("Please enter a valid email address")
    .normalizeEmail(),
  handleValidationErrors,
];

/**
 * Validation rules for resetting password using a recovery token.
 */
const resetPasswordValidation = [
  body("token")
    .notEmpty()
    .withMessage("Reset token is required"),
  strongPasswordChain("newPassword"),
  handleValidationErrors,
];

module.exports = {
  loginValidation,
  changePasswordValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
};
