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
 * Validation rules for creating an Audit.
 */
const createAuditValidation = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Audit title is required")
    .isLength({ min: 5, max: 150 })
    .withMessage("Title must be between 5 and 150 characters long"),
  body("department")
    .notEmpty()
    .withMessage("Department reference is required")
    .isMongoId()
    .withMessage("Department must be a valid MongoDB ObjectId"),
  body("startDate")
    .notEmpty()
    .withMessage("Start coverage date is required")
    .isISO8601()
    .withMessage("Start date must be a valid ISO8601 date format"),
  body("endDate")
    .notEmpty()
    .withMessage("End coverage date is required")
    .isISO8601()
    .withMessage("End date must be a valid ISO8601 date format")
    .custom((value, { req }) => {
      if (new Date(value) < new Date(req.body.startDate)) {
        throw new Error("End date must be greater than or equal to start date");
      }
      return true;
    }),
  body("auditedBy")
    .notEmpty()
    .withMessage("Auditor reference is required")
    .isMongoId()
    .withMessage("Auditor must be a valid MongoDB ObjectId"),
  handleValidationErrors,
];

/**
 * Validation rules for updating an Audit.
 */
const updateAuditValidation = [
  param("id")
    .isMongoId()
    .withMessage("Audit ID must be a valid MongoDB ObjectId"),
  body("title")
    .optional()
    .trim()
    .isLength({ min: 5, max: 150 })
    .withMessage("Title must be between 5 and 150 characters long"),
  body("findings")
    .optional()
    .trim()
    .isLength({ max: 3000 })
    .withMessage("Findings cannot exceed 3000 characters"),
  body("operationsAudited")
    .optional()
    .isArray()
    .withMessage("Operations audited must be an array of ObjectIds")
    .custom((arr) => {
      const { ObjectId } = require("mongoose").Types;
      if (!arr.every(id => ObjectId.isValid(id))) {
        throw new Error("Every operation reference must be a valid MongoDB ObjectId");
      }
      return true;
    }),
  body("status")
    .optional()
    .isIn(["Scheduled", "In Progress", "Completed", "Approved", "Rejected"])
    .withMessage("Status must be 'Scheduled', 'In Progress', 'Completed', 'Approved', or 'Rejected'"),
  handleValidationErrors,
];

/**
 * Validation rules for completing an Audit.
 */
const completeAuditValidation = [
  param("id")
    .isMongoId()
    .withMessage("Audit ID must be a valid MongoDB ObjectId"),
  body("findings")
    .trim()
    .notEmpty()
    .withMessage("Findings report content is required")
    .isLength({ max: 3000 })
    .withMessage("Findings cannot exceed 3000 characters"),
  body("operationsAudited")
    .optional()
    .isArray()
    .withMessage("Operations audited must be an array of ObjectIds")
    .custom((arr) => {
      const { ObjectId } = require("mongoose").Types;
      if (!arr.every(id => ObjectId.isValid(id))) {
        throw new Error("Every operation reference must be a valid MongoDB ObjectId");
      }
      return true;
    }),
  handleValidationErrors,
];

/**
 * Validation rules for audit lookup by ID.
 */
const auditIdValidation = [
  param("id")
    .isMongoId()
    .withMessage("ID must be a valid MongoDB ObjectId"),
  handleValidationErrors,
];

module.exports = {
  createAuditValidation,
  updateAuditValidation,
  completeAuditValidation,
  auditIdValidation,
};
