const emissionFactorService = require("../services/emissionFactorService");

/**
 * Extracts audit-relevant request details.
 */
const getRequestContext = (req) => ({
  adminUser: req.user,
  ipAddress: req.ip || req.headers["x-forwarded-for"] || null,
  userAgent: req.headers["user-agent"] || null,
});

/**
 * Handles POST /emission-factors.
 */
const createEmissionFactor = async (req, res, next) => {
  try {
    const { adminUser, ipAddress, userAgent } = getRequestContext(req);
    const factor = await emissionFactorService.createEmissionFactor(
      req.body,
      adminUser,
      ipAddress,
      userAgent
    );
    return res.status(201).json({
      success: true,
      message: "Emission factor created successfully.",
      data: factor,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handles GET /emission-factors.
 */
const getAllEmissionFactors = async (req, res, next) => {
  try {
    const factors = await emissionFactorService.getAllEmissionFactors(req.query);
    return res.status(200).json({
      success: true,
      message: "Emission factors retrieved successfully.",
      data: factors,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handles GET /emission-factors/:id.
 */
const getEmissionFactorById = async (req, res, next) => {
  try {
    const factor = await emissionFactorService.getEmissionFactorById(
      req.params.id
    );
    return res.status(200).json({
      success: true,
      message: "Emission factor retrieved successfully.",
      data: factor,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handles PATCH /emission-factors/:id.
 */
const updateEmissionFactor = async (req, res, next) => {
  try {
    const { adminUser, ipAddress, userAgent } = getRequestContext(req);
    const factor = await emissionFactorService.updateEmissionFactor(
      req.params.id,
      req.body,
      adminUser,
      ipAddress,
      userAgent
    );
    return res.status(200).json({
      success: true,
      message: "Emission factor updated successfully.",
      data: factor,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handles DELETE /emission-factors/:id.
 */
const deleteEmissionFactor = async (req, res, next) => {
  try {
    const { adminUser, ipAddress, userAgent } = getRequestContext(req);
    await emissionFactorService.deleteEmissionFactor(
      req.params.id,
      adminUser,
      ipAddress,
      userAgent
    );
    return res.status(200).json({
      success: true,
      message: "Emission factor soft-deleted successfully.",
      data: {},
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createEmissionFactor,
  getAllEmissionFactors,
  getEmissionFactorById,
  updateEmissionFactor,
  deleteEmissionFactor,
};
