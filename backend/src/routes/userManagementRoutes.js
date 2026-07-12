const express = require("express");
const router = express.Router();

const userManagementController = require("../controllers/userManagementController");
const userManagementValidation = require("../validations/userManagementValidation");
const {
  verifyJWT,
  authorize,
  requirePasswordChange,
} = require("../middleware/authMiddleware");

// Enforce authentication, password change completed, and Admin authorization for all User Management endpoints
router.use(verifyJWT);
router.use(requirePasswordChange);
router.use(authorize("Admin"));

// GET /users - Query users list
// POST /users - Create new manager, employee, or auditor
router
  .route("/")
  .get(userManagementController.getAllUsers)
  .post(
    userManagementValidation.createUserValidation,
    userManagementController.createUser
  );

// GET /users/:id - Get individual profile
// PATCH /users/:id - Modify profile parameters
router
  .route("/:id")
  .get(
    userManagementValidation.userIdValidation,
    userManagementController.getUserById
  )
  .patch(
    userManagementValidation.updateUserValidation,
    userManagementController.updateUser
  );

// PATCH /users/:id/deactivate - Deactivate user access (suspend)
router.patch(
  "/:id/deactivate",
  userManagementValidation.userIdValidation,
  userManagementController.deactivateUser
);

module.exports = router;
