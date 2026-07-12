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
 * Validation rules for creating a Badge rule.
 */
const createBadgeValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Badge name is required")
    .isLength({ min: 3, max: 100 })
    .withMessage("Name must be between 3 and 100 characters long"),
  body("description")
    .trim()
    .notEmpty()
    .withMessage("Badge description is required")
    .isLength({ min: 10, max: 500 })
    .withMessage("Description must be between 10 and 500 characters long"),
  body("imageUrl")
    .trim()
    .notEmpty()
    .withMessage("Badge icon URL is required")
    .isURL()
    .withMessage("Badge icon must be a valid URL link"),
  body("ruleType")
    .notEmpty()
    .withMessage("Rule type is required")
    .isIn(["CSR_COUNT", "XP_COUNT", "CHALLENGE_COUNT"])
    .withMessage("Rule type must be 'CSR_COUNT', 'XP_COUNT', or 'CHALLENGE_COUNT'"),
  body("ruleValue")
    .notEmpty()
    .withMessage("Rule threshold value is required")
    .isInt({ min: 1 })
    .withMessage("Threshold value must be an integer and at least 1"),
  handleValidationErrors,
];

/**
 * Validation rules for looking up a Badge by ID.
 */
const badgeIdValidation = [
  param("id")
    .isMongoId()
    .withMessage("ID must be a valid MongoDB ObjectId"),
  handleValidationErrors,
];

module.exports = {
  createBadgeValidation,
  badgeIdValidation,
};
