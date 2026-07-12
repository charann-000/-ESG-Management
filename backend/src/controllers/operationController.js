const operationService = require("../services/operationService");

/**
 * Extracts audit-relevant request details.
 */
const getRequestContext = (req) => ({
  managerUser: req.user,
  ipAddress: req.ip || req.headers["x-forwarded-for"] || null,
  userAgent: req.headers["user-agent"] || null,
});

/**
 * Handles POST /operations.
 */
const createOperation = async (req, res, next) => {
  try {
    const { managerUser, ipAddress, userAgent } = getRequestContext(req);
    const operation = await operationService.createOperation(
      req.body,
      managerUser,
      ipAddress,
      userAgent
    );
    return res.status(201).json({
      success: true,
      message: "Operational record logged successfully.",
      data: operation,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handles GET /operations.
 */
const getAllOperations = async (req, res, next) => {
  try {
    const operations = await operationService.getAllOperations(req.user);
    return res.status(200).json({
      success: true,
      message: "Operational records retrieved successfully.",
      data: operations,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handles GET /operations/:id.
 */
const getOperationById = async (req, res, next) => {
  try {
    const operation = await operationService.getOperationById(req.params.id, req.user);
    return res.status(200).json({
      success: true,
      message: "Operational record retrieved successfully.",
      data: operation,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handles PATCH /operations/:id.
 */
const updateOperation = async (req, res, next) => {
  try {
    const { managerUser, ipAddress, userAgent } = getRequestContext(req);
    const operation = await operationService.updateOperation(
      req.params.id,
      req.body,
      managerUser,
      ipAddress,
      userAgent
    );
    return res.status(200).json({
      success: true,
      message: "Operational record updated successfully.",
      data: operation,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handles DELETE /operations/:id.
 */
const deleteOperation = async (req, res, next) => {
  try {
    const { managerUser, ipAddress, userAgent } = getRequestContext(req);
    await operationService.deleteOperation(
      req.params.id,
      managerUser,
      ipAddress,
      userAgent
    );
    return res.status(200).json({
      success: true,
      message: "Operational record soft-deleted successfully.",
      data: {},
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOperation,
  getAllOperations,
  getOperationById,
  updateOperation,
  deleteOperation,
};
