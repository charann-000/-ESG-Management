const userManagementService = require("../services/userManagementService");

/**
 * Extracts audit-relevant request details.
 */
const getRequestContext = (req) => ({
  adminUser: req.user,
  ipAddress: req.ip || req.headers["x-forwarded-for"] || null,
  userAgent: req.headers["user-agent"] || null,
});

/**
 * Handles POST /users.
 */
const createUser = async (req, res, next) => {
  try {
    const { adminUser, ipAddress, userAgent } = getRequestContext(req);
    const user = await userManagementService.createUser(
      req.body,
      adminUser,
      ipAddress,
      userAgent
    );
    return res.status(201).json({
      success: true,
      message: "User created successfully.",
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handles GET /users.
 */
const getAllUsers = async (req, res, next) => {
  try {
    const users = await userManagementService.getAllUsers(req.query);
    return res.status(200).json({
      success: true,
      message: "Users retrieved successfully.",
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handles GET /users/:id.
 */
const getUserById = async (req, res, next) => {
  try {
    const user = await userManagementService.getUserById(req.params.id);
    return res.status(200).json({
      success: true,
      message: "User retrieved successfully.",
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handles PATCH /users/:id.
 */
const updateUser = async (req, res, next) => {
  try {
    const { adminUser, ipAddress, userAgent } = getRequestContext(req);
    const user = await userManagementService.updateUser(
      req.params.id,
      req.body,
      adminUser,
      ipAddress,
      userAgent
    );
    return res.status(200).json({
      success: true,
      message: "User updated successfully.",
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handles PATCH /users/:id/deactivate.
 */
const deactivateUser = async (req, res, next) => {
  try {
    const { adminUser, ipAddress, userAgent } = getRequestContext(req);
    await userManagementService.deactivateUser(
      req.params.id,
      adminUser,
      ipAddress,
      userAgent
    );
    return res.status(200).json({
      success: true,
      message: "User deactivated successfully.",
      data: {},
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deactivateUser,
};
