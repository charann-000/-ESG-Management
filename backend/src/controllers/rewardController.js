const rewardService = require("../services/rewardService");
const gamificationService = require("../services/gamificationService");

/**
 * Extracts audit-relevant request details.
 */
const getRequestContext = (req) => ({
  user: req.user,
  ipAddress: req.ip || req.headers["x-forwarded-for"] || null,
  userAgent: req.headers["user-agent"] || null,
});

/**
 * Handles POST /rewards (Admin only).
 */
const createReward = async (req, res, next) => {
  try {
    const { user, ipAddress, userAgent } = getRequestContext(req);
    const reward = await rewardService.createReward(
      req.body,
      user,
      ipAddress,
      userAgent
    );
    return res.status(201).json({
      success: true,
      message: "Reward created successfully.",
      data: reward,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handles GET /rewards (All authenticated roles).
 */
const getAllRewards = async (req, res, next) => {
  try {
    const rewards = await rewardService.getAllRewards();
    return res.status(200).json({
      success: true,
      message: "Rewards retrieved successfully.",
      data: rewards,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handles POST /rewards/:id/redeem (Employees only).
 */
const redeemReward = async (req, res, next) => {
  try {
    const { user, ipAddress, userAgent } = getRequestContext(req);
    const updatedUser = await gamificationService.redeemReward(
      user._id,
      req.params.id,
      ipAddress,
      userAgent
    );
    return res.status(200).json({
      success: true,
      message: "Reward redeemed successfully.",
      data: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createReward,
  getAllRewards,
  redeemReward,
};
