const complianceService = require("../services/complianceService");

/**
 * Extracts audit-relevant request details.
 */
const getRequestContext = (req) => ({
  user: req.user,
  ipAddress: req.ip || req.headers["x-forwarded-for"] || null,
  userAgent: req.headers["user-agent"] || null,
});

/**
 * Handles POST /compliance-issues.
 */
const createComplianceIssue = async (req, res, next) => {
  try {
    const { user, ipAddress, userAgent } = getRequestContext(req);
    const issue = await complianceService.createComplianceIssue(
      req.body,
      user,
      ipAddress,
      userAgent
    );
    return res.status(201).json({
      success: true,
      message: "Compliance issue logged successfully.",
      data: issue,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handles GET /compliance-issues.
 */
const getComplianceIssues = async (req, res, next) => {
  try {
    const issues = await complianceService.getAllComplianceIssues(req.user);
    return res.status(200).json({
      success: true,
      message: "Compliance issues retrieved successfully.",
      data: issues,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handles GET /compliance-issues/:id.
 */
const getComplianceIssueById = async (req, res, next) => {
  try {
    const issue = await complianceService.getComplianceIssueById(
      req.params.id,
      req.user
    );
    return res.status(200).json({
      success: true,
      message: "Compliance issue retrieved successfully.",
      data: issue,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handles PATCH /compliance-issues/:id/resolve.
 */
const resolveComplianceIssue = async (req, res, next) => {
  try {
    const { user, ipAddress, userAgent } = getRequestContext(req);
    const issue = await complianceService.resolveComplianceIssue(
      req.params.id,
      req.body,
      user,
      ipAddress,
      userAgent
    );
    return res.status(200).json({
      success: true,
      message: "Compliance issue marked as Resolved successfully.",
      data: issue,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handles PATCH /compliance-issues/:id/verify.
 */
const verifyComplianceIssue = async (req, res, next) => {
  try {
    const { user, ipAddress, userAgent } = getRequestContext(req);
    const issue = await complianceService.verifyComplianceIssue(
      req.params.id,
      req.body,
      user,
      ipAddress,
      userAgent
    );
    return res.status(200).json({
      success: true,
      message: "Compliance issue verification finalized successfully.",
      data: issue,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createComplianceIssue,
  getComplianceIssues,
  getComplianceIssueById,
  resolveComplianceIssue,
  verifyComplianceIssue,
};
