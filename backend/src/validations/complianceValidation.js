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
 * Validation rules for creating a Compliance Issue.
 */
const createComplianceValidation = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Issue title is required")
    .isLength({ min: 5, max: 150 })
    .withMessage("Title must be between 5 and 150 characters long"),
  body("description")
    .trim()
    .notEmpty()
    .withMessage("Issue description is required")
    .isLength({ min: 10, max: 2000 })
    .withMessage("Description must be between 10 and 2000 characters long"),
  body("department")
    .notEmpty()
    .withMessage("Department reference is required")
    .isMongoId()
    .withMessage("Department must be a valid MongoDB ObjectId"),
  body("audit")
    .optional({ nullable: true })
    .isMongoId()
    .withMessage("Audit reference must be a valid MongoDB ObjectId"),
  body("severity")
    .optional()
    .isIn(["Low", "Medium", "High", "Critical"])
    .withMessage("Severity must be 'Low', 'Medium', 'High', or 'Critical'"),
  handleValidationErrors,
];

/**
 * Validation rules for resolving a Compliance Issue.
 */
const resolveComplianceValidation = [
  param("id")
    .isMongoId()
    .withMessage("Issue ID must be a valid MongoDB ObjectId"),
  body("resolutionDetails")
    .trim()
    .notEmpty()
    .withMessage("Resolution details are required")
    .isLength({ min: 10, max: 2000 })
    .withMessage("Resolution details must be between 10 and 2000 characters long"),
  body("proof")
    .trim()
    .notEmpty()
    .withMessage("Resolution proof link is required")
    .isURL()
    .withMessage("Resolution proof must be a valid URL"),
  handleValidationErrors,
];

/**
 * Validation rules for verifying/closing a Compliance Issue.
 */
const verifyComplianceValidation = [
  param("id")
    .isMongoId()
    .withMessage("Issue ID must be a valid MongoDB ObjectId"),
  body("status")
    .notEmpty()
    .withMessage("Verification status is required")
    .isIn(["Verified", "Open"])
    .withMessage("Status must be 'Verified' (Close) or 'Open' (Reject)"),
  body("verificationDetails")
    .trim()
    .notEmpty()
    .withMessage("Verification details are required")
    .isLength({ min: 10, max: 2000 })
    .withMessage("Verification details must be between 10 and 2000 characters long"),
  handleValidationErrors,
];

/**
 * Validation rules for compliance lookup by ID.
 */
const complianceIdValidation = [
  param("id")
    .isMongoId()
    .withMessage("ID must be a valid MongoDB ObjectId"),
  handleValidationErrors,
];

module.exports = {
  createComplianceValidation,
  resolveComplianceValidation,
  verifyComplianceValidation,
  complianceIdValidation,
};
