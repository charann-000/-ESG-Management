const dashboardService = require("../services/dashboardService");

/**
 * Handles GET /dashboard/admin.
 * Authorized for Admin and Auditor roles.
 */
const getAdminDashboard = async (req, res, next) => {
  try {
    const data = await dashboardService.getAdminDashboardData();
    return res.status(200).json({
      success: true,
      message: "Admin dashboard metrics retrieved successfully.",
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handles GET /dashboard/department.
 * Authorized for Department Manager and Employee roles.
 */
const getDepartmentDashboard = async (req, res, next) => {
  try {
    const departmentId = req.user.department;
    if (!departmentId) {
      return res.status(400).json({
        success: false,
        message: "Your account is not assigned to any department.",
        errors: [],
      });
    }

    const data = await dashboardService.getDepartmentDashboardData(departmentId);
    return res.status(200).json({
      success: true,
      message: "Department dashboard metrics retrieved successfully.",
      data,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAdminDashboard,
  getDepartmentDashboard,
};
