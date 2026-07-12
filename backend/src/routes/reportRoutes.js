const express = require("express");
const router = express.Router();

const reportController = require("../controllers/reportController");
// Re-import governance handler from controllers
const legacyController = require("../controllers/reportController");
const policyController = require("../controllers/policyController"); // If needed, but let's check. Wait, we imported legacy reportController. Let's keep it clean.

const {
  verifyJWT,
  authorize,
  requirePasswordChange,
} = require("../middleware/authMiddleware");

// Enforce authentication globally for all Report endpoints
router.use(verifyJWT);
router.use(requirePasswordChange);

// ==========================================
// Legacy Endpoint
// ==========================================
router.get(
  "/governance",
  authorize("Admin", "Auditor"),
  reportController.exportGovernancePdf // Map legacy endpoint or use standard
);

// ==========================================
// PDF DOWNLOAD ROUTES
// ==========================================
router.get("/esg/pdf", authorize("Admin"), reportController.exportEsgPdf);
router.get("/environment/pdf", authorize("Admin"), reportController.exportEnvironmentPdf);
router.get("/social/pdf", authorize("Admin"), reportController.exportSocialPdf);
router.get("/governance/pdf", authorize("Admin"), reportController.exportGovernancePdf);
router.get("/carbon/pdf", authorize("Admin", "Department Manager"), reportController.exportCarbonPdf);
router.get("/department/:id/pdf", authorize("Admin", "Department Manager"), reportController.exportDepartmentPdf);
router.get("/csr/pdf", authorize("Admin"), reportController.exportCsrPdf);
router.get("/challenges/pdf", authorize("Admin"), reportController.exportChallengesPdf);
router.get("/compliance/pdf", authorize("Admin", "Auditor", "Department Manager"), reportController.exportCompliancePdf);
router.get("/audits/pdf", authorize("Admin", "Auditor", "Department Manager"), reportController.exportAuditsPdf);
router.get("/employees/pdf", authorize("Admin"), reportController.exportEmployeesPdf);

// ==========================================
// EXCEL DOWNLOAD ROUTES
// ==========================================
router.get("/esg/excel", authorize("Admin"), reportController.exportEsgExcel);
router.get("/carbon/excel", authorize("Admin", "Department Manager"), reportController.exportCarbonExcel);
router.get("/operations/excel", authorize("Admin", "Department Manager"), reportController.exportOperationsExcel);
router.get("/compliance/excel", authorize("Admin", "Auditor", "Department Manager"), reportController.exportComplianceExcel);
router.get("/employees/excel", authorize("Admin"), reportController.exportEmployeesExcel);
router.get("/challenges/excel", authorize("Admin"), reportController.exportChallengesExcel);
router.get("/csr/excel", authorize("Admin"), reportController.exportCsrExcel);

module.exports = router;
