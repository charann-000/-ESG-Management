const { body, param, validationResult } = require("express-validator");

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
 * Validation rules for creating a CSR Activity.
 */
const createCsrActivityValidation = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("CSR Activity title is required")
    .isLength({ min: 5, max: 150 })
    .withMessage("Title must be between 5 and 150 characters long"),
  body("description")
    .trim()
    .notEmpty()
    .withMessage("CSR Activity description is required")
    .isLength({ min: 10, max: 1500 })
    .withMessage("Description must be between 10 and 1500 characters long"),
  body("date")
    .notEmpty()
    .withMessage("Schedule date is required")
    .isISO8601()
    .withMessage("Schedule date must be a valid ISO8601 date format"),
  body("location")
    .trim()
    .notEmpty()
    .withMessage("Location is required")
    .isLength({ max: 150 })
    .withMessage("Location cannot exceed 150 characters"),
  body("xpReward")
    .notEmpty()
    .withMessage("XP reward is required")
    .isInt({ min: 0 })
    .withMessage("XP reward must be an integer and cannot be negative"),
  body("coinReward")
    .notEmpty()
    .withMessage("Coin reward is required")
    .isInt({ min: 0 })
    .withMessage("Coin reward must be an integer and cannot be negative"),
  body("badgeReward")
    .optional({ nullable: true })
    .isMongoId()
    .withMessage("Badge reward must be a valid MongoDB ObjectId"),
  handleValidationErrors,
];

/**
 * Validation rules for joining/participating in CSR Activity.
 */
const participateCsrValidation = [
  param("id")
    .isMongoId()
    .withMessage("Activity ID must be a valid MongoDB ObjectId"),
  body("proof")
    .trim()
    .notEmpty()
    .withMessage("Proof URL is required")
    .isURL()
    .withMessage("Proof must be a valid URL"),
  handleValidationErrors,
];

/**
 * Validation rules for verifying participation.
 */
const verifyCsrValidation = [
  param("id")
    .isMongoId()
    .withMessage("Activity ID must be a valid MongoDB ObjectId"),
  param("employeeId")
    .isMongoId()
    .withMessage("Employee ID must be a valid MongoDB ObjectId"),
  body("status")
    .notEmpty()
    .withMessage("Verification status is required")
    .isIn(["Approved", "Rejected"])
    .withMessage("Status must be 'Approved' or 'Rejected'"),
  body("remarks")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Remarks cannot exceed 500 characters"),
  handleValidationErrors,
];

/**
 * Validation rules for looking up a CSR Activity by ID.
 */
const csrIdValidation = [
  param("id")
    .isMongoId()
    .withMessage("ID must be a valid MongoDB ObjectId"),
  handleValidationErrors,
];

module.exports = {
  createCsrActivityValidation,
  participateCsrValidation,
  verifyCsrValidation,
  csrIdValidation,
};
