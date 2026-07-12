const express = require("express");
const router = express.Router();

const operationController = require("../controllers/operationController");
const operationValidation = require("../validations/operationValidation");
const {
  verifyJWT,
  authorize,
  requirePasswordChange,
} = require("../middleware/authMiddleware");

// Enforce authentication, completed password updates, and Department Manager role authorization globally
router.use(verifyJWT);
router.use(requirePasswordChange);
router.use(authorize("Department Manager"));

// GET /operations - List active operations for the manager's department
// POST /operations - Log a new operational record
router
  .route("/")
  .get(operationController.getAllOperations)
  .post(
    operationValidation.createOperationValidation,
    operationController.createOperation
  );

// GET /operations/:id - Detail view
// PATCH /operations/:id - Update values
// DELETE /operations/:id - Soft delete
router
  .route("/:id")
  .get(
    operationValidation.operationIdValidation,
    operationController.getOperationById
  )
  .patch(
    operationValidation.updateOperationValidation,
    operationController.updateOperation
  )
  .delete(
    operationValidation.operationIdValidation,
    operationController.deleteOperation
  );

module.exports = router;
