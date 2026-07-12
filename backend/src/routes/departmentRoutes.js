const express = require("express");
const router = express.Router();

const departmentController = require("../controllers/departmentController");
const departmentValidation = require("../validations/departmentValidation");
const {
  verifyJWT,
  authorize,
  requirePasswordChange,
} = require("../middleware/authMiddleware");

// Enforce authentication, forced password change completion, and Admin-only authorization globally for all department endpoints
router.use(verifyJWT);
router.use(requirePasswordChange);
router.use(authorize("Admin"));

// GET /departments - List active departments
// POST /departments - Create a new department
router
  .route("/")
  .get(departmentController.getAllDepartments)
  .post(
    departmentValidation.createDepartmentValidation,
    departmentController.createDepartment
  );

// GET /departments/:id - Get department details
// PATCH /departments/:id - Update department details
// DELETE /departments/:id - Soft-delete department
router
  .route("/:id")
  .get(
    departmentValidation.departmentIdValidation,
    departmentController.getDepartmentById
  )
  .patch(
    departmentValidation.updateDepartmentValidation,
    departmentController.updateDepartment
  )
  .delete(
    departmentValidation.departmentIdValidation,
    departmentController.deleteDepartment
  );

module.exports = router;
