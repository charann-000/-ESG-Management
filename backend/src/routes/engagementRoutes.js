const express = require("express");
const router = express.Router();

const {
  verifyJWT,
  authorize,
  requirePasswordChange,
} = require("../middleware/authMiddleware");

// Controllers
const badgeController = require("../controllers/badgeController");
const rewardController = require("../controllers/rewardController");
const csrController = require("../controllers/csrController");
const challengeController = require("../controllers/challengeController");
const notificationController = require("../controllers/notificationController");
const gamificationService = require("../services/gamificationService");

// Validations
const badgeValidation = require("../validations/badgeValidation");
const rewardValidation = require("../validations/rewardValidation");
const csrValidation = require("../validations/csrValidation");
const challengeValidation = require("../validations/challengeValidation");

// Enforce authentication globally for all Engagement Engine endpoints
router.use(verifyJWT);
router.use(requirePasswordChange);

// ==========================================
// 1. Badge Endpoints
// ==========================================
router
  .route("/badges")
  .get(badgeController.getAllBadges)
  .post(
    authorize("Admin"),
    badgeValidation.createBadgeValidation,
    badgeController.createBadge
  );

// ==========================================
// 2. Reward Endpoints
// ==========================================
router
  .route("/rewards")
  .get(rewardController.getAllRewards)
  .post(
    authorize("Admin"),
    rewardValidation.createRewardValidation,
    rewardController.createReward
  );

router.post(
  "/rewards/:id/redeem",
  authorize("Employee"),
  rewardValidation.rewardIdValidation,
  rewardController.redeemReward
);

// ==========================================
// 3. CSR Activities Endpoints
// ==========================================
router
  .route("/csr-activities")
  .get(csrController.getCsrActivities)
  .post(
    authorize("Department Manager"),
    csrValidation.createCsrActivityValidation,
    csrController.createCsrActivity
  );

router.post(
  "/csr-activities/:id/participate",
  authorize("Employee"),
  csrValidation.participateCsrValidation,
  csrController.participateInCsr
);

router.patch(
  "/csr-activities/:id/participants/:employeeId/verify",
  authorize("Department Manager"),
  csrValidation.verifyCsrValidation,
  csrController.verifyCsrParticipation
);

// ==========================================
// 4. Challenge Endpoints
// ==========================================
router
  .route("/challenges")
  .get(challengeController.getChallenges)
  .post(
    authorize("Department Manager"),
    challengeValidation.createChallengeValidation,
    challengeController.createChallenge
  );

router.post(
  "/challenges/:id/join",
  authorize("Employee"),
  challengeValidation.challengeIdValidation,
  challengeController.joinChallenge
);

router.post(
  "/challenges/:id/submit",
  authorize("Employee"),
  challengeValidation.submitProofValidation,
  challengeController.submitChallengeProof
);

router.patch(
  "/challenges/:id/participants/:employeeId/verify",
  authorize("Department Manager"),
  challengeValidation.verifyChallengeValidation,
  challengeController.verifyChallengeCompletion
);

// ==========================================
// 5. Dynamic Leaderboard Endpoint
// ==========================================
router.get("/leaderboard", async (req, res, next) => {
  try {
    const departmentId = req.query.department || null;
    const leaderboard = await gamificationService.getLeaderboard(departmentId);
    return res.status(200).json({
      success: true,
      message: "Leaderboard retrieved successfully.",
      data: leaderboard,
    });
  } catch (error) {
    next(error);
  }
});

// ==========================================
// 6. Notification Endpoints
// ==========================================
router.get("/notifications", notificationController.getNotifications);
router.patch("/notifications/:id/read", notificationController.markAsRead);

module.exports = router;
