const departmentService = require("../services/departmentService");

/**
 * Extracts audit-relevant request details.
 */
const getRequestContext = (req) => ({
  adminUser: req.user,
  ipAddress: req.ip || req.headers["x-forwarded-for"] || null,
  userAgent: req.headers["user-agent"] || null,
});

/**
 * Handles POST /departments.
 */
const createDepartment = async (req, res, next) => {
  try {
    const { adminUser, ipAddress, userAgent } = getRequestContext(req);
    const department = await departmentService.createDepartment(
      req.body,
      adminUser,
      ipAddress,
      userAgent
    );
    return res.status(201).json({
      success: true,
      message: "Department created successfully.",
      data: department,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handles GET /departments.
 */
const getAllDepartments = async (req, res, next) => {
  try {
    const departments = await departmentService.getAllDepartments(req.query);
    return res.status(200).json({
      success: true,
      message: "Departments retrieved successfully.",
      data: departments,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handles GET /departments/:id.
 */
const getDepartmentById = async (req, res, next) => {
  try {
    const department = await departmentService.getDepartmentById(req.params.id);
    return res.status(200).json({
      success: true,
      message: "Department retrieved successfully.",
      data: department,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handles PATCH /departments/:id.
 */
const updateDepartment = async (req, res, next) => {
  try {
    const { adminUser, ipAddress, userAgent } = getRequestContext(req);
    const department = await departmentService.updateDepartment(
      req.params.id,
      req.body,
      adminUser,
      ipAddress,
      userAgent
    );
    return res.status(200).json({
      success: true,
      message: "Department updated successfully.",
      data: department,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handles DELETE /departments/:id.
 */
const deleteDepartment = async (req, res, next) => {
  try {
    const { adminUser, ipAddress, userAgent } = getRequestContext(req);
    await departmentService.deleteDepartment(
      req.params.id,
      adminUser,
      ipAddress,
      userAgent
    );
    return res.status(200).json({
      success: true,
      message: "Department soft-deleted successfully.",
      data: {},
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createDepartment,
  getAllDepartments,
  getDepartmentById,
  updateDepartment,
  deleteDepartment,
};
