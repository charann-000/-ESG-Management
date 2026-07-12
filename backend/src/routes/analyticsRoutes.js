const express = require("express");
const router = express.Router();

const analyticsController = require("../controllers/analyticsController");
const {
  verifyJWT,
  authorize,
  requirePasswordChange,
} = require("../middleware/authMiddleware");

// Enforce authentication globally for all Analytics endpoints
router.use(verifyJWT);
router.use(requirePasswordChange);

// ==========================================
// Admin Scope Endpoints
// ==========================================
router.get("/overview", authorize("Admin"), analyticsController.getOverview);
router.get("/carbon/monthly", authorize("Admin"), analyticsController.getCarbonMonthly);
router.get("/carbon/source", authorize("Admin"), analyticsController.getCarbonSource);
router.get("/departments/esg", authorize("Admin"), analyticsController.getDepartmentsEsg);
router.get("/operations/trend", authorize("Admin"), analyticsController.getOperationsTrend);
router.get("/csr", authorize("Admin"), analyticsController.getCsr);
router.get("/challenges", authorize("Admin"), analyticsController.getChallenges);
router.get("/rewards", authorize("Admin"), analyticsController.getRewards);
router.get("/badges", authorize("Admin"), analyticsController.getBadges);
router.get("/compliance", authorize("Admin"), analyticsController.getCompliance);
router.get("/policies", authorize("Admin"), analyticsController.getPolicies);
router.get("/audits", authorize("Admin"), analyticsController.getAudits);

// ==========================================
// Manager Scope Endpoints
// ==========================================
router.get("/department", authorize("Department Manager"), analyticsController.getDepartmentAnalytics);

// ==========================================
// Employee Scope Endpoints
// ==========================================
router.get("/me", authorize("Employee"), analyticsController.getMyAnalytics);

// ==========================================
// Auditor Scope Endpoints
// ==========================================
router.get("/auditor", authorize("Auditor"), analyticsController.getAuditorAnalytics);

module.exports = router;
