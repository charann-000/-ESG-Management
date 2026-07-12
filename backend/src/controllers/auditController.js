const auditService = require("../services/auditService");

/**
 * Extracts audit-relevant request details.
 */
const getRequestContext = (req) => ({
  user: req.user,
  ipAddress: req.ip || req.headers["x-forwarded-for"] || null,
  userAgent: req.headers["user-agent"] || null,
});

/**
 * Handles POST /audits.
 */
const createAudit = async (req, res, next) => {
  try {
    const { user, ipAddress, userAgent } = getRequestContext(req);
    const audit = await auditService.createAudit(
      req.body,
      user,
      ipAddress,
      userAgent
    );
    return res.status(201).json({
      success: true,
      message: "Audit scheduled successfully.",
      data: audit,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handles GET /audits.
 */
const getAudits = async (req, res, next) => {
  try {
    const audits = await auditService.getAllAudits(req.user);
    return res.status(200).json({
      success: true,
      message: "Audits retrieved successfully.",
      data: audits,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handles GET /audits/:id.
 */
const getAuditById = async (req, res, next) => {
  try {
    const audit = await auditService.getAuditById(req.params.id, req.user);
    return res.status(200).json({
      success: true,
      message: "Audit retrieved successfully.",
      data: audit,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handles PATCH /audits/:id.
 */
const updateAudit = async (req, res, next) => {
  try {
    const { user, ipAddress, userAgent } = getRequestContext(req);
    const audit = await auditService.updateAudit(
      req.params.id,
      req.body,
      user,
      ipAddress,
      userAgent
    );
    return res.status(200).json({
      success: true,
      message: "Audit updated successfully.",
      data: audit,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handles POST /audits/:id/complete.
 */
const completeAudit = async (req, res, next) => {
  try {
    const { user, ipAddress, userAgent } = getRequestContext(req);
    const audit = await auditService.completeAudit(
      req.params.id,
      req.body,
      user,
      ipAddress,
      userAgent
    );
    return res.status(200).json({
      success: true,
      message: "Audit marked as Completed successfully.",
      data: audit,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createAudit,
  getAudits,
  getAuditById,
  updateAudit,
  completeAudit,
};
