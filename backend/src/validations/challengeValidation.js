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
 * Validation rules for creating a Challenge.
 */
const createChallengeValidation = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Challenge title is required")
    .isLength({ min: 5, max: 150 })
    .withMessage("Title must be between 5 and 150 characters long"),
  body("description")
    .trim()
    .notEmpty()
    .withMessage("Challenge description is required")
    .isLength({ min: 10, max: 1500 })
    .withMessage("Description must be between 10 and 1500 characters long"),
  body("startDate")
    .notEmpty()
    .withMessage("Start date is required")
    .isISO8601()
    .withMessage("Start date must be a valid ISO8601 date format"),
  body("endDate")
    .notEmpty()
    .withMessage("End date is required")
    .isISO8601()
    .withMessage("End date must be a valid ISO8601 date format")
    .custom((value, { req }) => {
      if (new Date(value) < new Date(req.body.startDate)) {
        throw new Error("End date must be greater than or equal to start date");
      }
      return true;
    }),
  body("xpReward")
    .notEmpty()
    .withMessage("XP reward is required")
    .isInt({ min: 0 })
    .withMessage("XP reward must be an integer and cannot be negative"),
  body("scope")
    .notEmpty()
    .withMessage("Scope is required")
    .isIn(["company", "department"])
    .withMessage("Scope must be 'company' or 'department'"),
  body("department")
    .custom((value, { req }) => {
      if (req.body.scope === "department") {
        if (!value || value === "") {
          throw new Error("Department reference is required when scope is 'department'");
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
 * Validation rules for submitting challenge completion proof.
 */
const submitProofValidation = [
  param("id")
    .isMongoId()
    .withMessage("Challenge ID must be a valid MongoDB ObjectId"),
  body("proof")
    .trim()
    .notEmpty()
    .withMessage("Proof URL is required")
    .isURL()
    .withMessage("Proof must be a valid URL link"),
  handleValidationErrors,
];

/**
 * Validation rules for verifying challenge completion status.
 */
const verifyChallengeValidation = [
  param("id")
    .isMongoId()
    .withMessage("Challenge ID must be a valid MongoDB ObjectId"),
  param("employeeId")
    .isMongoId()
    .withMessage("Employee ID must be a valid MongoDB ObjectId"),
  body("status")
    .notEmpty()
    .withMessage("Verification status is required")
    .isIn(["Completed", "Rejected"])
    .withMessage("Status must be 'Completed' or 'Rejected'"),
  body("remarks")
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage("Remarks cannot exceed 500 characters"),
  handleValidationErrors,
];

/**
 * Validation rules for challenge lookup by ID.
 */
const challengeIdValidation = [
  param("id")
    .isMongoId()
    .withMessage("ID must be a valid MongoDB ObjectId"),
  handleValidationErrors,
];

module.exports = {
  createChallengeValidation,
  submitProofValidation,
  verifyChallengeValidation,
  challengeIdValidation,
};
