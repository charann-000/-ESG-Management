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
 * Validation rules for creating a Department.
 */
const createDepartmentValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Department name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Department name must be between 2 and 100 characters long"),
  body("code")
    .trim()
    .notEmpty()
    .withMessage("Department code is required")
    .toUpperCase()
    .isLength({ min: 3, max: 15 })
    .withMessage("Code must be between 3 and 15 characters long")
    .matches(/^[A-Z0-9-]+$/)
    .withMessage("Code can only contain uppercase letters, numbers, and hyphens"),
  body("location")
    .trim()
    .notEmpty()
    .withMessage("Location is required")
    .isLength({ min: 2, max: 150 })
    .withMessage("Location must be between 2 and 150 characters long"),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Description cannot exceed 500 characters"),
  body("manager")
    .optional({ nullable: true })
    .isMongoId()
    .withMessage("Manager must be a valid MongoDB ObjectId"),
  handleValidationErrors,
];

/**
 * Validation rules for updating a Department.
 */
const updateDepartmentValidation = [
  param("id")
    .isMongoId()
    .withMessage("Department ID must be a valid MongoDB ObjectId"),
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Department name must be between 2 and 100 characters long"),
  body("code")
    .optional()
    .trim()
    .toUpperCase()
    .isLength({ min: 3, max: 15 })
    .withMessage("Code must be between 3 and 15 characters long")
    .matches(/^[A-Z0-9-]+$/)
    .withMessage("Code can only contain uppercase letters, numbers, and hyphens"),
  body("location")
    .optional()
    .trim()
    .isLength({ min: 2, max: 150 })
    .withMessage("Location must be between 2 and 150 characters long"),
  body("description")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Description cannot exceed 500 characters"),
  body("manager")
    .optional({ nullable: true })
    .custom((val) => {
      if (val === null || val === "") return true;
      const { ObjectId } = require("mongoose").Types;
      if (!ObjectId.isValid(val)) {
        throw new Error("Manager must be a valid MongoDB ObjectId or null");
      }
      return true;
    }),
  body("status")
    .optional()
    .isIn(["Active", "Inactive"])
    .withMessage("Status must be either 'Active' or 'Inactive'"),
  handleValidationErrors,
];

/**
 * Validation rules for simple route ID queries.
 */
const departmentIdValidation = [
  param("id")
    .isMongoId()
    .withMessage("ID must be a valid MongoDB ObjectId"),
  handleValidationErrors,
];

module.exports = {
  createDepartmentValidation,
  updateDepartmentValidation,
  departmentIdValidation,
};
