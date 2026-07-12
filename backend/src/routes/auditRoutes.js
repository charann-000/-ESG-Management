const express = require("express");
const router = express.Router();

const auditController = require("../controllers/auditController");
const auditValidation = require("../validations/auditValidation");
const {
  verifyJWT,
  authorize,
  requirePasswordChange,
} = require("../middleware/authMiddleware");

// Enforce authentication globally for all Audit endpoints
router.use(verifyJWT);
router.use(requirePasswordChange);

// GET /audits - List audits (Auditor, Admin, or Manager)
// POST /audits - Schedule a new audit (Auditor or Admin only)
router
  .route("/")
  .get(
    authorize("Auditor", "Admin", "Department Manager"),
    auditController.getAudits
  )
  .post(
    authorize("Auditor", "Admin"),
    auditValidation.createAuditValidation,
    auditController.createAudit
  );

// POST /audits/:id/complete - Finalize audit (Auditor or Admin only)
router.post(
  "/:id/complete",
  authorize("Auditor", "Admin"),
  auditValidation.completeAuditValidation,
  auditController.completeAudit
);

// GET /audits/:id - View audit details (Auditor, Admin, or Department Manager)
// PATCH /audits/:id - Update scheduled audit (Auditor or Admin only)
router
  .route("/:id")
  .get(
    authorize("Auditor", "Admin", "Department Manager"),
    auditValidation.auditIdValidation,
    auditController.getAuditById
  )
  .patch(
    authorize("Auditor", "Admin"),
    auditValidation.updateAuditValidation,
    auditController.updateAudit
  );

module.exports = router;
