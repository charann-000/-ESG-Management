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
 * Validation rules for creating an Operational Record.
 */
const createOperationValidation = [
  body("type")
    .notEmpty()
    .withMessage("Operation type is required")
    .isIn(["Purchase", "Electricity", "Fleet", "Manufacturing", "Waste"])
    .withMessage("Type must be 'Purchase', 'Electricity', 'Fleet', 'Manufacturing', or 'Waste'"),
  body("quantity")
    .notEmpty()
    .withMessage("Quantity is required")
    .isFloat({ min: 0.0001 })
    .withMessage("Quantity must be a positive number greater than zero"),
  body("unit")
    .trim()
    .notEmpty()
    .withMessage("Unit is required"),
  body("emissionFactor")
    .notEmpty()
    .withMessage("Emission Factor is required")
    .isMongoId()
    .withMessage("Emission Factor must be a valid MongoDB ObjectId"),
  body("evidenceFiles")
    .isArray({ min: 1 })
    .withMessage("At least one evidence file URL is required")
    .custom((arr) => {
      if (!arr.every(url => typeof url === "string" && url.trim().startsWith("http"))) {
        throw new Error("Every evidence file must be a valid URL string");
      }
      return true;
    }),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Description cannot exceed 500 characters"),
  body("date")
    .optional()
    .isISO8601()
    .withMessage("Date must be a valid ISO8601 date format")
    .custom((value) => {
      if (new Date(value) > new Date()) {
        throw new Error("Operation date cannot be in the future");
      }
      return true;
    }),
  handleValidationErrors,
];

/**
 * Validation rules for updating an Operational Record.
 */
const updateOperationValidation = [
  param("id")
    .isMongoId()
    .withMessage("Operation ID must be a valid MongoDB ObjectId"),
  body("type")
    .optional()
    .isIn(["Purchase", "Electricity", "Fleet", "Manufacturing", "Waste"])
    .withMessage("Type must be 'Purchase', 'Electricity', 'Fleet', 'Manufacturing', or 'Waste'"),
  body("quantity")
    .optional()
    .isFloat({ min: 0.0001 })
    .withMessage("Quantity must be a positive number greater than zero"),
  body("unit")
    .optional()
    .trim(),
  body("emissionFactor")
    .optional()
    .isMongoId()
    .withMessage("Emission Factor must be a valid MongoDB ObjectId"),
  body("evidenceFiles")
    .optional()
    .isArray({ min: 1 })
    .withMessage("Evidence files must be an array with at least one file URL")
    .custom((arr) => {
      if (!arr.every(url => typeof url === "string" && url.trim().startsWith("http"))) {
        throw new Error("Every evidence file must be a valid URL string");
      }
      return true;
    }),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Description cannot exceed 500 characters"),
  body("date")
    .optional()
    .isISO8601()
    .withMessage("Date must be a valid ISO8601 date format")
    .custom((value) => {
      if (new Date(value) > new Date()) {
        throw new Error("Operation date cannot be in the future");
      }
      return true;
    }),
  handleValidationErrors,
];

/**
 * Validation rules for looking up an Operation by ID.
 */
const operationIdValidation = [
  param("id")
    .isMongoId()
    .withMessage("ID must be a valid MongoDB ObjectId"),
  handleValidationErrors,
];

module.exports = {
  createOperationValidation,
  updateOperationValidation,
  operationIdValidation,
};
