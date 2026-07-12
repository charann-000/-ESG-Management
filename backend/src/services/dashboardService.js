const mongoose = require("mongoose");
const Operation = require("../models/Operation");
const Department = require("../models/Department");

/**
 * Service handling dashboard KPIs and data aggregation logic.
 */

/**
 * Utility helper to get date ranges (Start of Today and Start of Current Month).
 */
const getDateRanges = () => {
  const now = new Date();
  
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  return { startOfToday, startOfMonth };
};

/**
 * Compiles administrative global dashboard data.
 */
const getAdminDashboardData = async () => {
  const { startOfToday, startOfMonth } = getDateRanges();

  // 1. Total carbon emitted across all active operations
  const totalCarbonResult = await Operation.aggregate([
    { $match: { status: "Active" } },
    { $group: { _id: null, total: { $sum: "$carbonEmission" } } }
  ]);
  const totalCarbon = totalCarbonResult.length > 0 ? totalCarbonResult[0].total : 0;

  // 2. Count of operations logged today
  const operationsToday = await Operation.countDocuments({
    status: "Active",
    date: { $gte: startOfToday }
  });

  // 3. Count of operations logged this month
  const operationsThisMonth = await Operation.countDocuments({
    status: "Active",
    date: { $gte: startOfMonth }
  });

  // 4. Department list with ESG scores
  const departmentScores = await Department.find({ status: "Active" })
    .select("name code environmentalScore socialScore governanceScore overallEsgScore")
    .sort({ overallEsgScore: -1 });

  // 5. Recent 10 operations, populated with department and recorder details
  const recentOperations = await Operation.find({ status: "Active" })
    .select("type quantity unit carbonEmission date description department recordedBy")
    .populate("department", "name code")
    .populate("recordedBy", "name email")
    .sort({ date: -1 })
    .limit(10);

  // 6. Top emitting categories
  const topCategories = await Operation.aggregate([
    { $match: { status: "Active" } },
    {
      $group: {
        _id: "$type",
        carbonEmitted: { $sum: "$carbonEmission" }
      }
    },
    { $sort: { carbonEmitted: -1 } }
  ]);

  return {
    totalCarbon: parseFloat(totalCarbon.toFixed(2)),
    operationsToday,
    operationsThisMonth,
    departmentScores,
    recentOperations,
    topCategories: topCategories.map(c => ({
      category: c._id,
      carbonEmitted: parseFloat(c.carbonEmitted.toFixed(2))
    }))
  };
};

/**
 * Compiles specific Department Manager dashboard data.
 */
const getDepartmentDashboardData = async (departmentId) => {
  if (!departmentId) {
    throw new Error("Department context is required");
  }

  const { startOfToday, startOfMonth } = getDateRanges();
  const deptObjectId = new mongoose.Types.ObjectId(departmentId);

  // Validate department exists
  const department = await Department.findById(departmentId).select(
    "name code environmentalScore socialScore governanceScore overallEsgScore"
  );
  if (!department) {
    throw new Error("Department not found");
  }

  // 1. Total carbon emitted by this department
  const totalCarbonResult = await Operation.aggregate([
    { $match: { department: deptObjectId, status: "Active" } },
    { $group: { _id: "$department", total: { $sum: "$carbonEmission" } } }
  ]);
  const totalCarbon = totalCarbonResult.length > 0 ? totalCarbonResult[0].total : 0;

  // 2. Operations today for this department
  const operationsToday = await Operation.countDocuments({
    department: departmentId,
    status: "Active",
    date: { $gte: startOfToday }
  });

  // 3. Operations this month for this department
  const operationsThisMonth = await Operation.countDocuments({
    department: departmentId,
    status: "Active",
    date: { $gte: startOfMonth }
  });

  // 4. Recent 10 operations for this department
  const recentOperations = await Operation.find({ department: departmentId, status: "Active" })
    .select("type quantity unit carbonEmission date description recordedBy")
    .populate("recordedBy", "name email")
    .sort({ date: -1 })
    .limit(10);

  return {
    department: {
      id: department._id,
      name: department.name,
      code: department.code,
      environmentalScore: department.environmentalScore,
      socialScore: department.socialScore,
      governanceScore: department.governanceScore,
      overallEsgScore: department.overallEsgScore
    },
    totalCarbon: parseFloat(totalCarbon.toFixed(2)),
    operationsToday,
    operationsThisMonth,
    recentOperations
  };
};

module.exports = {
  getAdminDashboardData,
  getDepartmentDashboardData
};
