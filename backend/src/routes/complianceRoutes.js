const express = require("express");
const router = express.Router();

const complianceController = require("../controllers/complianceController");
const complianceValidation = require("../validations/complianceValidation");
const {
  verifyJWT,
  authorize,
  requirePasswordChange,
} = require("../middleware/authMiddleware");

// Enforce authentication globally for all Compliance endpoints
router.use(verifyJWT);
router.use(requirePasswordChange);

// GET /compliance-issues - Query list (All roles read-only, but scoped)
// POST /compliance-issues - File violation (Auditor only)
router
  .route("/")
  .get(complianceController.getComplianceIssues)
  .post(
    authorize("Auditor"),
    complianceValidation.createComplianceValidation,
    complianceController.createComplianceIssue
  );

// PATCH /compliance-issues/:id/resolve - Submit resolution details (Manager only)
router.patch(
  "/:id/resolve",
  authorize("Department Manager"),
  complianceValidation.resolveComplianceValidation,
  complianceController.resolveComplianceIssue
);

// PATCH /compliance-issues/:id/verify - Approve/Reject resolution (Auditor only)
router.patch(
  "/:id/verify",
  authorize("Auditor"),
  complianceValidation.verifyComplianceValidation,
  complianceController.verifyComplianceIssue
);

// GET /compliance-issues/:id - Detailed view (scoped by department)
router.get(
  "/:id",
  complianceValidation.complianceIdValidation,
  complianceController.getComplianceIssueById
);

module.exports = router;
