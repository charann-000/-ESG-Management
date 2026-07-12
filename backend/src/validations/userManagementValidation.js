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
 * Validation rules for creating a User.
 */
const createUserValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters long"),
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please enter a valid email address")
    .normalizeEmail(),
  body("role")
    .notEmpty()
    .withMessage("Role is required")
    .isIn(["Department Manager", "Employee", "Auditor"])
    .withMessage("Role must be 'Department Manager', 'Employee', or 'Auditor' (Admin creation not permitted)"),
  body("department")
    .custom((value, { req }) => {
      const role = req.body.role;
      if (["Department Manager", "Employee"].includes(role)) {
        if (!value || value === "") {
          throw new Error(`Department is required for role: ${role}`);
        }
        const { ObjectId } = require("mongoose").Types;
        if (!ObjectId.isValid(value)) {
          throw new Error("Department must be a valid MongoDB ObjectId");
        }
      }
      return true;
    }),
  handleValidationErrors,
];

/**
 * Validation rules for updating a User.
 */
const updateUserValidation = [
  param("id")
    .isMongoId()
    .withMessage("User ID must be a valid MongoDB ObjectId"),
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage("Name must be between 2 and 100 characters long"),
  body("role")
    .optional()
    .isIn(["Department Manager", "Employee", "Auditor"])
    .withMessage("Role must be 'Department Manager', 'Employee', or 'Auditor'"),
  body("department")
    .optional({ nullable: true })
    .custom((value, { req }) => {
      // Check if it's set or if role is being changed
      const { ObjectId } = require("mongoose").Types;
      if (value && !ObjectId.isValid(value)) {
        throw new Error("Department must be a valid MongoDB ObjectId");
      }
      return true;
    }),
  body("status")
    .optional()
    .isIn(["Pending", "Active", "Suspended"])
    .withMessage("Status must be 'Pending', 'Active', or 'Suspended'"),
  handleValidationErrors,
];

/**
 * Validation rules for user lookup by ID.
 */
const userIdValidation = [
  param("id")
    .isMongoId()
    .withMessage("User ID must be a valid MongoDB ObjectId"),
  handleValidationErrors,
];

module.exports = {
  createUserValidation,
  updateUserValidation,
  userIdValidation,
};
