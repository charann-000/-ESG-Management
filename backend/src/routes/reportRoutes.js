const express = require("express");
const router = express.Router();

const reportController = require("../controllers/reportController");
const {
  verifyJWT,
  authorize,
  requirePasswordChange,
} = require("../middleware/authMiddleware");

// Enforce authentication globally for all Report endpoints
router.use(verifyJWT);
router.use(requirePasswordChange);

// GET /reports/governance - Generate Governance Compliance Report (Admin and Auditor only)
router.get(
  "/governance",
  authorize("Admin", "Auditor"),
  reportController.getGovernanceReport
);

module.exports = router;
