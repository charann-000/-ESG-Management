const policyService = require("../services/policyService");

/**
 * Extracts audit-relevant request details.
 */
const getRequestContext = (req) => ({
  user: req.user,
  ipAddress: req.ip || req.headers["x-forwarded-for"] || null,
  userAgent: req.headers["user-agent"] || null,
});

/**
 * Handles POST /policies (Admin only).
 */
const createPolicy = async (req, res, next) => {
  try {
    const { user, ipAddress, userAgent } = getRequestContext(req);
    const policy = await policyService.createPolicy(
      req.body,
      user,
      ipAddress,
      userAgent
    );
    return res.status(201).json({
      success: true,
      message: "Policy published successfully.",
      data: policy,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handles GET /policies.
 */
const getPolicies = async (req, res, next) => {
  try {
    const policies = await policyService.getAllPolicies(req.user);
    return res.status(200).json({
      success: true,
      message: "Policies retrieved successfully.",
      data: policies,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handles GET /policies/:id.
 */
const getPolicyById = async (req, res, next) => {
  try {
    const policy = await policyService.getPolicyById(req.params.id);
    return res.status(200).json({
      success: true,
      message: "Policy retrieved successfully.",
      data: policy,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handles PATCH /policies/:id (Admin only).
 */
const updatePolicy = async (req, res, next) => {
  try {
    const { user, ipAddress, userAgent } = getRequestContext(req);
    const policy = await policyService.updatePolicy(
      req.params.id,
      req.body,
      user,
      ipAddress,
      userAgent
    );
    return res.status(200).json({
      success: true,
      message: "Policy updated successfully.",
      data: policy,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handles DELETE /policies/:id (Admin only).
 */
const deletePolicy = async (req, res, next) => {
  try {
    const { user, ipAddress, userAgent } = getRequestContext(req);
    await policyService.deletePolicy(
      req.params.id,
      user,
      ipAddress,
      userAgent
    );
    return res.status(200).json({
      success: true,
      message: "Policy archived successfully.",
      data: {},
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handles POST /policies/:id/accept (Employees only).
 */
const acceptPolicy = async (req, res, next) => {
  try {
    const { user, ipAddress, userAgent } = getRequestContext(req);
    const updatedUser = await policyService.acceptPolicy(
      req.params.id,
      user,
      ipAddress,
      userAgent
    );
    return res.status(200).json({
      success: true,
      message: "Policy accepted successfully.",
      data: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handles GET /policies/:id/stats.
 */
const getPolicyStats = async (req, res, next) => {
  try {
    const stats = await policyService.getPolicyStats(req.params.id);
    return res.status(200).json({
      success: true,
      message: "Policy stats compiled successfully.",
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPolicy,
  getPolicies,
  getPolicyById,
  updatePolicy,
  deletePolicy,
  acceptPolicy,
  getPolicyStats,
};
