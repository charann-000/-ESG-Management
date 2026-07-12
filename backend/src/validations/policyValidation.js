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
 * Validation rules for creating a Policy.
 */
const createPolicyValidation = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Policy title is required")
    .isLength({ min: 5, max: 150 })
    .withMessage("Title must be between 5 and 150 characters long"),
  body("description")
    .trim()
    .notEmpty()
    .withMessage("Policy description is required")
    .isLength({ min: 10, max: 2000 })
    .withMessage("Description must be between 10 and 2000 characters long"),
  body("documentUrl")
    .trim()
    .notEmpty()
    .withMessage("Document link is required")
    .isURL()
    .withMessage("Document link must be a valid URL"),
  handleValidationErrors,
];

/**
 * Validation rules for updating a Policy.
 */
const updatePolicyValidation = [
  param("id")
    .isMongoId()
    .withMessage("Policy ID must be a valid MongoDB ObjectId"),
  body("title")
    .optional()
    .trim()
    .isLength({ min: 5, max: 150 })
    .withMessage("Title must be between 5 and 150 characters long"),
  body("description")
    .optional()
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage("Description must be between 10 and 2000 characters long"),
  body("documentUrl")
    .optional()
    .trim()
    .isURL()
    .withMessage("Document link must be a valid URL"),
  body("status")
    .optional()
    .isIn(["Active", "Archived"])
    .withMessage("Status must be 'Active' or 'Archived'"),
  handleValidationErrors,
];

/**
 * Validation rules for policy lookup by ID.
 */
const policyIdValidation = [
  param("id")
    .isMongoId()
    .withMessage("ID must be a valid MongoDB ObjectId"),
  handleValidationErrors,
];

module.exports = {
  createPolicyValidation,
  updatePolicyValidation,
  policyIdValidation,
};
