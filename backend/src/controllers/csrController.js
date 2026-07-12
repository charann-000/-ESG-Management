const csrService = require("../services/csrService");

/**
 * Extracts audit-relevant request details.
 */
const getRequestContext = (req) => ({
  user: req.user,
  ipAddress: req.ip || req.headers["x-forwarded-for"] || null,
  userAgent: req.headers["user-agent"] || null,
});

/**
 * Handles POST /csr-activities.
 */
const createCsrActivity = async (req, res, next) => {
  try {
    const { user, ipAddress, userAgent } = getRequestContext(req);
    const activity = await csrService.createCsrActivity(
      req.body,
      user,
      ipAddress,
      userAgent
    );
    return res.status(201).json({
      success: true,
      message: "CSR Activity created successfully.",
      data: activity,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handles GET /csr-activities.
 */
const getCsrActivities = async (req, res, next) => {
  try {
    const activities = await csrService.getAllCsrActivities(req.user);
    return res.status(200).json({
      success: true,
      message: "CSR Activities retrieved successfully.",
      data: activities,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handles POST /csr-activities/:id/participate.
 */
const participateInCsr = async (req, res, next) => {
  try {
    const { user, ipAddress, userAgent } = getRequestContext(req);
    const activity = await csrService.participateInCsr(
      req.params.id,
      req.body,
      user,
      ipAddress,
      userAgent
    );
    return res.status(200).json({
      success: true,
      message: "CSR Activity participation submitted successfully.",
      data: activity,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handles PATCH /csr-activities/:id/participants/:employeeId/verify.
 */
const verifyCsrParticipation = async (req, res, next) => {
  try {
    const { user, ipAddress, userAgent } = getRequestContext(req);
    const activity = await csrService.verifyCsrParticipation(
      req.params.id,
      req.params.employeeId,
      req.body,
      user,
      ipAddress,
      userAgent
    );
    return res.status(200).json({
      success: true,
      message: "CSR Activity participation verified successfully.",
      data: activity,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createCsrActivity,
  getCsrActivities,
  participateInCsr,
  verifyCsrParticipation,
};
