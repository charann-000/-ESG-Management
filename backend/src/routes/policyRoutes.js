const express = require("express");
const router = express.Router();

const policyController = require("../controllers/policyController");
const policyValidation = require("../validations/policyValidation");
const {
  verifyJWT,
  authorize,
  requirePasswordChange,
} = require("../middleware/authMiddleware");

// Enforce authentication globally for all Policy endpoints
router.use(verifyJWT);
router.use(requirePasswordChange);

// GET /policies - List policies based on user permissions
// POST /policies - Create & Publish policy (Admin only)
router
  .route("/")
  .get(policyController.getPolicies)
  .post(
    authorize("Admin"),
    policyValidation.createPolicyValidation,
    policyController.createPolicy
  );

// GET /policies/:id/stats - View department-wise acceptance statistics (Admin & Manager only)
router.get(
  "/:id/stats",
  authorize("Admin", "Department Manager"),
  policyValidation.policyIdValidation,
  policyController.getPolicyStats
);

// POST /policies/:id/accept - Read and accept policy (Employee only)
router.post(
  "/:id/accept",
  authorize("Employee"),
  policyValidation.policyIdValidation,
  policyController.acceptPolicy
);

// GET /policies/:id - View detail
// PATCH /policies/:id - Update policy (Admin only)
// DELETE /policies/:id - Soft-delete/Archive policy (Admin only)
router
  .route("/:id")
  .get(
    policyValidation.policyIdValidation,
    policyController.getPolicyById
  )
  .patch(
    authorize("Admin"),
    policyValidation.updatePolicyValidation,
    policyController.updatePolicy
  )
  .delete(
    authorize("Admin"),
    policyValidation.policyIdValidation,
    policyController.deletePolicy
  );

module.exports = router;
