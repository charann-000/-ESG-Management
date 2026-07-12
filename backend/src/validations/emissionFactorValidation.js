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
 * Validation rules for creating an Emission Factor.
 */
const createEmissionFactorValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Emission factor name is required")
    .isLength({ min: 3, max: 150 })
    .withMessage("Name must be between 3 and 150 characters long"),
  body("activityType")
    .notEmpty()
    .withMessage("Activity type is required")
    .isIn(["Purchase", "Electricity", "Fleet", "Manufacturing", "Waste"])
    .withMessage("Activity type must be 'Purchase', 'Electricity', 'Fleet', 'Manufacturing', or 'Waste'"),
  body("factor")
    .notEmpty()
    .withMessage("Factor coefficient is required")
    .isFloat({ min: 0 })
    .withMessage("Factor must be a positive number (minimum 0)"),
  body("unit")
    .trim()
    .notEmpty()
    .withMessage("Unit is required")
    .toLowerCase(),
  body("source")
    .trim()
    .notEmpty()
    .withMessage("Regulatory source is required")
    .isLength({ min: 3, max: 200 })
    .withMessage("Source description must be between 3 and 200 characters long"),
  body("year")
    .optional()
    .isInt({ min: 2000, max: 2100 })
    .withMessage("Year must be an integer between 2000 and 2100"),
  handleValidationErrors,
];

/**
 * Validation rules for updating an Emission Factor.
 */
const updateEmissionFactorValidation = [
  param("id")
    .isMongoId()
    .withMessage("Emission Factor ID must be a valid MongoDB ObjectId"),
  body("name")
    .optional()
    .trim()
    .isLength({ min: 3, max: 150 })
    .withMessage("Name must be between 3 and 150 characters long"),
  body("activityType")
    .optional()
    .isIn(["Purchase", "Electricity", "Fleet", "Manufacturing", "Waste"])
    .withMessage("Activity type must be 'Purchase', 'Electricity', 'Fleet', 'Manufacturing', or 'Waste'"),
  body("factor")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Factor must be a positive number (minimum 0)"),
  body("unit")
    .optional()
    .trim()
    .toLowerCase(),
  body("source")
    .optional()
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage("Source description must be between 3 and 200 characters long"),
  body("year")
    .optional()
    .isInt({ min: 2000, max: 2100 })
    .withMessage("Year must be an integer between 2000 and 2100"),
  body("status")
    .optional()
    .isIn(["Active", "Inactive"])
    .withMessage("Status must be 'Active' or 'Inactive'"),
  handleValidationErrors,
];

/**
 * Validation rules for looking up an Emission Factor by ID.
 */
const emissionFactorIdValidation = [
  param("id")
    .isMongoId()
    .withMessage("ID must be a valid MongoDB ObjectId"),
  handleValidationErrors,
];

module.exports = {
  createEmissionFactorValidation,
  updateEmissionFactorValidation,
  emissionFactorIdValidation,
};
