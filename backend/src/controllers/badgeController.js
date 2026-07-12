const badgeService = require("../services/badgeService");

/**
 * Extracts audit-relevant request details.
 */
const getRequestContext = (req) => ({
  adminUser: req.user,
  ipAddress: req.ip || req.headers["x-forwarded-for"] || null,
  userAgent: req.headers["user-agent"] || null,
});

/**
 * Handles POST /badges.
 */
const createBadge = async (req, res, next) => {
  try {
    const { adminUser, ipAddress, userAgent } = getRequestContext(req);
    const badge = await badgeService.createBadge(
      req.body,
      adminUser,
      ipAddress,
      userAgent
    );
    return res.status(201).json({
      success: true,
      message: "Badge created successfully.",
      data: badge,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handles GET /badges.
 */
const getAllBadges = async (req, res, next) => {
  try {
    const badges = await badgeService.getAllBadges();
    return res.status(200).json({
      success: true,
      message: "Badges retrieved successfully.",
      data: badges,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createBadge,
  getAllBadges,
};
