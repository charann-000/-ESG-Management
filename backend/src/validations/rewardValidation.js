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
 * Validation rules for creating a Reward.
 */
const createRewardValidation = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Reward title is required")
    .isLength({ min: 3, max: 100 })
    .withMessage("Title must be between 3 and 100 characters long"),
  body("description")
    .trim()
    .notEmpty()
    .withMessage("Reward description is required")
    .isLength({ min: 10, max: 1000 })
    .withMessage("Description must be between 10 and 1000 characters long"),
  body("cost")
    .notEmpty()
    .withMessage("Coin cost is required")
    .isInt({ min: 1 })
    .withMessage("Cost must be an integer and at least 1 coin"),
  body("stock")
    .notEmpty()
    .withMessage("Stock quantity is required")
    .isInt({ min: 0 })
    .withMessage("Stock must be an integer and at least 0"),
  body("imageUrl")
    .optional({ nullable: true })
    .trim()
    .isURL()
    .withMessage("Image link must be a valid URL format"),
  handleValidationErrors,
];

/**
 * Validation rules for looking up a Reward by ID.
 */
const rewardIdValidation = [
  param("id")
    .isMongoId()
    .withMessage("ID must be a valid MongoDB ObjectId"),
  handleValidationErrors,
];

module.exports = {
  createRewardValidation,
  rewardIdValidation,
};
