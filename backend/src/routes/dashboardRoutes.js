const express = require("express");
const router = express.Router();

const dashboardController = require("../controllers/dashboardController");
const {
  verifyJWT,
  authorize,
  requirePasswordChange,
} = require("../middleware/authMiddleware");

// Enforce authentication and completed password updates globally for all dashboard routes
router.use(verifyJWT);
router.use(requirePasswordChange);

// GET /dashboard/admin - Global KPIs (Admin and Auditor only)
router.get(
  "/admin",
  authorize("Admin", "Auditor"),
  dashboardController.getAdminDashboard
);

// GET /dashboard/department - Department-specific KPIs (Manager and Employee only)
router.get(
  "/department",
  authorize("Department Manager", "Employee"),
  dashboardController.getDepartmentDashboard
);

module.exports = router;
