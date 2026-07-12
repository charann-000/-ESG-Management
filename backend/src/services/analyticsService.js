const mongoose = require("mongoose");
const User = require("../models/User");
const Department = require("../models/Department");
const Operation = require("../models/Operation");
const CSRActivity = require("../models/CSRActivity");
const Challenge = require("../models/Challenge");
const ComplianceIssue = require("../models/ComplianceIssue");
const Policy = require("../models/Policy");
const Audit = require("../models/Audit");
const Reward = require("../models/Reward");
const Badge = require("../models/Badge");

/**
 * Helper to build date filters based on query parameters.
 */
const buildDateFilter = (filters) => {
  const match = {};
  if (filters.startDate || filters.endDate) {
    match.date = {};
    if (filters.startDate) match.date.$gte = new Date(filters.startDate);
    if (filters.endDate) match.date.$lte = new Date(filters.endDate);
  }
  if (filters.department) {
    match.department = new mongoose.Types.ObjectId(filters.department);
  }
  return match;
};

/**
 * 1. Admin Overview KPIs
 */
const getAdminOverview = async () => {
  // Average ESG ratings
  const scoreAgg = await Department.aggregate([
    {
      $group: {
        _id: null,
        avgOverall: { $avg: "$overallEsgScore" },
        avgEnv: { $avg: "$environmentalScore" },
        avgSoc: { $avg: "$socialScore" },
        avgGov: { $avg: "$governanceScore" },
      },
    },
  ]);

  const scores = scoreAgg[0] || { avgOverall: 0, avgEnv: 0, avgSoc: 0, avgGov: 0 };

  // Total carbon emissions
  const carbonAgg = await Operation.aggregate([
    { $match: { status: "Active" } },
    { $group: { _id: null, total: { $sum: "$carbonEmission" } } },
  ]);
  const totalCarbon = carbonAgg[0]?.total || 0;

  // User counts
  const totalEmployees = await User.countDocuments({ role: "Employee", status: "Active" });
  const totalDepartments = await Department.countDocuments({ status: "Active" });

  // Counts of activities/compliance
  const activeChallenges = await Challenge.countDocuments({ status: { $ne: "Cancelled" } });
  const activeCsr = await CSRActivity.countDocuments({ status: { $ne: "Cancelled" } });
  const openCompliance = await ComplianceIssue.countDocuments({ status: "Open" });
  const closedCompliance = await ComplianceIssue.countDocuments({ status: "Verified" });

  return {
    scores: {
      overallEsg: Math.round(scores.avgOverall),
      environmental: Math.round(scores.avgEnv),
      social: Math.round(scores.avgSoc),
      governance: Math.round(scores.avgGov),
    },
    totalCarbon,
    totalDepartments,
    totalEmployees,
    activeChallenges,
    activeCsrActivities: activeCsr,
    complianceIssues: {
      open: openCompliance,
      closed: closedCompliance,
    },
  };
};

/**
 * 2. Monthly Carbon Emissions Trend
 */
const getMonthlyCarbon = async (year = new Date().getFullYear()) => {
  const start = new Date(`${year}-01-01T00:00:00.000Z`);
  const end = new Date(`${year}-12-31T23:59:59.999Z`);

  const results = await Operation.aggregate([
    {
      $match: {
        status: "Active",
        date: { $gte: start, $lte: end },
      },
    },
    {
      $group: {
        _id: { $month: "$date" },
        carbon: { $sum: "$carbonEmission" },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const trend = months.map((month, idx) => {
    const matched = results.find((r) => r._id === idx + 1);
    return { month, carbon: matched ? Math.round(matched.carbon) : 0 };
  });

  return trend;
};

/**
 * 3. Carbon Emissions Grouped by Source
 */
const getCarbonBySource = async (filters = {}) => {
  const match = buildDateFilter(filters);
  match.status = "Active";

  const results = await Operation.aggregate([
    { $match: match },
    {
      $group: {
        _id: "$type",
        carbon: { $sum: "$carbonEmission" },
      },
    },
  ]);

  const defaultSources = ["Purchase", "Electricity", "Fleet", "Manufacturing", "Waste"];
  return defaultSources.map((source) => {
    const matched = results.find((r) => r._id === source);
    return { source, carbon: matched ? Math.round(matched.carbon) : 0 };
  });
};

/**
 * 4. Department-wise ESG Averages
 */
const getDepartmentsEsg = async () => {
  return Department.find({ status: "Active" })
    .select("name code environmentalScore socialScore governanceScore overallEsgScore")
    .sort({ overallEsgScore: -1 });
};

/**
 * 5. Monthly Operations Logged Trend
 */
const getOperationsTrend = async (filters = {}) => {
  const match = buildDateFilter(filters);
  match.status = "Active";

  const results = await Operation.aggregate([
    { $match: match },
    {
      $group: {
        _id: {
          year: { $year: "$date" },
          month: { $month: "$date" },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } },
  ]);

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return results.map((r) => ({
    label: `${months[r._id.month - 1]} ${r._id.year}`,
    operations: r.count,
  }));
};

/**
 * 6. CSR Activities Participation Stats
 */
const getCsrStats = async (filters = {}) => {
  const match = {};
  if (filters.department) {
    match.department = new mongoose.Types.ObjectId(filters.department);
  }

  const activities = await CSRActivity.find(match);

  let totalParticipants = 0;
  let approvedCount = 0;
  let pendingCount = 0;
  
  activities.forEach((act) => {
    totalParticipants += act.participants.length;
    act.participants.forEach((p) => {
      if (p.status === "Approved") approvedCount++;
      if (p.status === "Pending Approval") pendingCount++;
    });
  });

  const totalEmployees = await User.countDocuments({ role: "Employee", status: "Active" });
  const participationRate = totalEmployees > 0 ? (totalParticipants / totalEmployees) * 100 : 0;

  return {
    totalParticipants,
    approvedCount,
    pendingCount,
    participationRate: parseFloat(participationRate.toFixed(2)),
    activeActivitiesCount: activities.filter((a) => a.status !== "Cancelled").length,
  };
};

/**
 * 7. Challenges Completion Rates
 */
const getChallengesStats = async (filters = {}) => {
  const match = {};
  if (filters.department) {
    match.department = new mongoose.Types.ObjectId(filters.department);
  }

  const challenges = await Challenge.find(match);

  let totalJoins = 0;
  let completedCount = 0;

  challenges.forEach((ch) => {
    totalJoins += ch.participants.length;
    ch.participants.forEach((p) => {
      if (p.status === "Completed") completedCount++;
    });
  });

  const completionRate = totalJoins > 0 ? (completedCount / totalJoins) * 100 : 0;

  return {
    totalJoins,
    completedCount,
    completionRate: parseFloat(completionRate.toFixed(2)),
    activeChallengesCount: challenges.filter((c) => c.status !== "Cancelled").length,
  };
};

/**
 * 8. Reward Redemption Rankings
 */
const getRewardsStats = async () => {
  // Aggregate most redeemed rewards
  const redeemedAgg = await User.aggregate([
    { $unwind: "$redemptions" },
    {
      $group: {
        _id: "$redemptions.reward",
        redemptionCount: { $sum: 1 },
        totalCoinsSpent: { $sum: "$redemptions.coinsSpent" },
      },
    },
    { $sort: { redemptionCount: -1 } },
    { $limit: 10 },
  ]);

  const populated = [];
  for (const r of redeemedAgg) {
    const reward = await Reward.findById(r._id).select("title cost stock");
    if (reward) {
      populated.push({
        rewardId: reward._id,
        rewardTitle: reward.title,
        cost: reward.cost,
        stock: reward.stock,
        redemptionCount: r.redemptionCount,
        coinsSpent: r.totalCoinsSpent,
      });
    }
  }

  return populated;
};

/**
 * 9. Badges Earning Distribution
 */
const getBadgesStats = async () => {
  const earnedAgg = await User.aggregate([
    { $unwind: "$badges" },
    {
      $group: {
        _id: "$badges.badge",
        earnedCount: { $sum: 1 },
      },
    },
    { $sort: { earnedCount: -1 } },
  ]);

  const populated = [];
  for (const b of earnedAgg) {
    const badge = await Badge.findById(b._id).select("name imageUrl ruleType");
    if (badge) {
      populated.push({
        badgeId: badge._id,
        badgeName: badge.name,
        ruleType: badge.ruleType,
        earnedCount: b.earnedCount,
      });
    }
  }

  return populated;
};

/**
 * 10. Compliance Issue KPIs & Resolution Time
 */
const getComplianceStats = async (filters = {}) => {
  const match = {};
  if (filters.department) {
    match.department = new mongoose.Types.ObjectId(filters.department);
  }

  const issues = await ComplianceIssue.find(match);

  let open = 0;
  let resolved = 0;
  let verified = 0;
  let totalResolutionTimeMs = 0;
  let resolvedWithDurationCount = 0;

  issues.forEach((issue) => {
    if (issue.status === "Open") open++;
    if (issue.status === "Resolved") resolved++;
    if (issue.status === "Verified") verified++;

    if (issue.resolvedAt && issue.createdAt) {
      const duration = new Date(issue.resolvedAt) - new Date(issue.createdAt);
      totalResolutionTimeMs += duration;
      resolvedWithDurationCount++;
    }
  });

  const avgResolutionTimeDays =
    resolvedWithDurationCount > 0
      ? totalResolutionTimeMs / (1000 * 60 * 60 * 24 * resolvedWithDurationCount)
      : 0;

  return {
    open,
    resolved,
    verified, // Closed
    totalIssues: issues.length,
    averageResolutionTimeDays: parseFloat(avgResolutionTimeDays.toFixed(2)),
  };
};

/**
 * 11. Policy Adherence rates
 */
const getPoliciesStats = async () => {
  const activePolicies = await Policy.find({ status: "Active" });
  const P = activePolicies.length;
  
  const employees = await User.find({ role: "Employee", status: "Active" });
  const E = employees.length;

  if (P === 0 || E === 0) {
    return {
      averageAcceptanceRate: 100,
      activePoliciesCount: P,
      totalEmployees: E,
      departmentStats: [],
    };
  }

  let acceptancesCount = 0;
  const policyIds = activePolicies.map((p) => p._id.toString());
  
  for (const emp of employees) {
    const acceptedIds = emp.acceptedPolicies.map((ap) => ap.policy.toString());
    const count = policyIds.filter((id) => acceptedIds.includes(id)).length;
    acceptancesCount += count;
  }

  const averageAcceptance = (acceptancesCount / (P * E)) * 100;

  // Department-wise breakdown
  const departments = await Department.find({ status: "Active" });
  const deptBreakdown = [];

  for (const dept of departments) {
    const deptEmployees = await User.countDocuments({
      department: dept._id,
      role: "Employee",
      status: "Active",
    });

    const deptAcceptances = await User.countDocuments({
      department: dept._id,
      role: "Employee",
      status: "Active",
      "acceptedPolicies.policy": { $in: activePolicies.map((p) => p._id) },
    });

    const rate = deptEmployees > 0 ? (deptAcceptances / (P * deptEmployees)) * 100 : 100;
    deptBreakdown.push({
      departmentName: dept.name,
      acceptanceRate: parseFloat(rate.toFixed(2)),
    });
  }

  return {
    averageAcceptanceRate: parseFloat(averageAcceptance.toFixed(2)),
    activePoliciesCount: P,
    totalEmployees: E,
    departmentStats: deptBreakdown,
  };
};

/**
 * 12. Audit Coverage Stats
 */
const getAuditsStats = async (filters = {}) => {
  const match = {};
  if (filters.department) {
    match.department = new mongoose.Types.ObjectId(filters.department);
  }

  const audits = await Audit.find(match);

  let completed = 0;
  let scheduled = 0;
  let inProgress = 0;
  let findingsCount = 0;

  audits.forEach((aud) => {
    if (aud.status === "Completed") completed++;
    if (aud.status === "Scheduled") scheduled++;
    if (aud.status === "In Progress") inProgress++;
    if (aud.findings && aud.findings.trim() !== "") findingsCount++;
  });

  return {
    totalAudits: audits.length,
    completed,
    pending: scheduled + inProgress,
    auditsWithFindings: findingsCount,
  };
};

/**
 * 13. Manager Department-scoped Dashboard
 */
const getManagerAnalytics = async (departmentId) => {
  if (!departmentId) {
    throw new Error("Manager department reference is required");
  }

  const department = await Department.findById(departmentId);
  if (!department) {
    throw new Error("Department not found");
  }

  const carbonBySource = await getCarbonBySource({ department: departmentId });
  const operationsTrend = await getOperationsTrend({ department: departmentId });
  const csr = await getCsrStats({ department: departmentId });
  const challenges = await getChallengesStats({ department: departmentId });
  const compliance = await getComplianceStats({ department: departmentId });
  const audits = await getAuditsStats({ department: departmentId });

  const activeEmployeesCount = await User.countDocuments({
    department: departmentId,
    role: "Employee",
    status: "Active",
  });

  return {
    department: {
      id: department._id,
      name: department.name,
      code: department.code,
      scores: {
        environmental: department.environmentalScore,
        social: department.socialScore,
        governance: department.governanceScore,
        overallEsg: department.overallEsgScore,
      },
    },
    activeEmployeesCount,
    carbonBySource,
    operationsTrend,
    csr,
    challenges,
    compliance,
    audits,
  };
};

/**
 * 14. Employee Profile Dashboard
 */
const getEmployeeAnalytics = async (userId) => {
  const user = await User.findById(userId)
    .populate("badges.badge", "name imageUrl description")
    .populate("redemptions.reward", "title cost description");

  if (!user) {
    throw new Error("Employee profile not found");
  }

  // Calculate dynamic rank based on total XP sorted globally
  const rankingList = await User.find({ role: "Employee", status: "Active" })
    .sort({ xp: -1 })
    .select("_id");
  const rankIndex = rankingList.findIndex((u) => u._id.toString() === userId.toString());
  const rank = rankIndex !== -1 ? rankIndex + 1 : rankingList.length;

  // Personal carbon contribution (sum emissions of operations logged by this employee)
  const operationEmissions = await Operation.aggregate([
    {
      $match: {
        recordedBy: new mongoose.Types.ObjectId(userId),
        status: "Active",
      },
    },
    { $group: { _id: null, total: { $sum: "$carbonEmission" } } },
  ]);
  const carbonContribution = operationEmissions[0]?.total || 0;

  // Personal CSR activities count
  const csrCount = await CSRActivity.countDocuments({
    "participants.employee": userId,
    "participants.status": "Approved",
  });

  // Personal completed challenges count
  const challengeCount = await Challenge.countDocuments({
    "participants.employee": userId,
    "participants.status": "Completed",
  });

  return {
    xp: user.xp,
    coins: user.coins,
    globalRank: rank,
    carbonContribution,
    stats: {
      approvedCsrActivities: csrCount,
      completedChallenges: challengeCount,
    },
    badges: user.badges.map((b) => ({
      badgeName: b.badge.name,
      imageUrl: b.badge.imageUrl,
      earnedAt: b.earnedAt,
    })),
    redemptions: user.redemptions.map((r) => ({
      rewardTitle: r.reward.title,
      coinsSpent: r.coinsSpent,
      redeemedAt: r.redeemedAt,
    })),
  };
};

/**
 * 15. Auditor console KPIs
 */
const getAuditorAnalytics = async (auditorId) => {
  const auditsConducted = await Audit.countDocuments({ auditedBy: auditorId });
  const auditsCompleted = await Audit.countDocuments({ auditedBy: auditorId, status: "Completed" });

  const issuesRaised = await ComplianceIssue.countDocuments({ createdBy: auditorId });
  const issuesClosed = await ComplianceIssue.countDocuments({ createdBy: auditorId, status: "Verified" });

  const issues = await ComplianceIssue.find({ createdBy: auditorId });
  let totalResolutionTimeMs = 0;
  let resolvedCount = 0;

  issues.forEach((issue) => {
    if (issue.resolvedAt && issue.createdAt) {
      totalResolutionTimeMs += new Date(issue.resolvedAt) - new Date(issue.createdAt);
      resolvedCount++;
    }
  });

  const avgResolutionTimeDays =
    resolvedCount > 0 ? totalResolutionTimeMs / (1000 * 60 * 60 * 24 * resolvedCount) : 0;

  return {
    auditsConducted,
    auditsCompleted,
    issuesRaised,
    issuesClosed,
    averageResolutionTimeDays: parseFloat(avgResolutionTimeDays.toFixed(2)),
  };
};

module.exports = {
  getAdminOverview,
  getMonthlyCarbon,
  getCarbonBySource,
  getDepartmentsEsg,
  getOperationsTrend,
  getCsrStats,
  getChallengesStats,
  getRewardsStats,
  getBadgesStats,
  getComplianceStats,
  getPoliciesStats,
  getAuditsStats,
  getManagerAnalytics,
  getEmployeeAnalytics,
  getAuditorAnalytics,
};
