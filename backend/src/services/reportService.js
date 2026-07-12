const Policy = require("../models/Policy");
const Audit = require("../models/Audit");
const ComplianceIssue = require("../models/ComplianceIssue");
const Department = require("../models/Department");
const User = require("../models/User");

/**
 * Compiles a comprehensive Governance Report for the platform.
 */
const generateGovernanceReport = async (filters = {}) => {
  const query = {};
  if (filters.department) {
    query._id = filters.department;
  }

  // 1. Fetch departments and their scores
  const departments = await Department.find(query).select(
    "name code environmentalScore socialScore governanceScore overallEsgScore"
  );

  const reportDetails = [];

  for (const dept of departments) {
    // 2. Audit counts
    const totalAudits = await Audit.countDocuments({ department: dept._id });
    const completedAudits = await Audit.countDocuments({
      department: dept._id,
      status: "Completed",
    });

    // 3. Compliance issue counts
    const totalIssues = await ComplianceIssue.countDocuments({ department: dept._id });
    const openIssues = await ComplianceIssue.countDocuments({
      department: dept._id,
      status: "Open",
    });
    const resolvedIssues = await ComplianceIssue.countDocuments({
      department: dept._id,
      status: "Resolved",
    });
    const verifiedIssues = await ComplianceIssue.countDocuments({
      department: dept._id,
      status: "Verified",
    });

    // 4. Policy acceptance statistics for this department
    const activePolicies = await Policy.find({ status: "Active" });
    const totalActivePolicies = activePolicies.length;
    
    const activeEmployees = await User.countDocuments({
      department: dept._id,
      role: "Employee",
      status: "Active",
    });

    let acceptancesCount = 0;
    if (totalActivePolicies > 0 && activeEmployees > 0) {
      const policyIds = activePolicies.map((p) => p._id);
      
      const acceptedCount = await User.countDocuments({
        department: dept._id,
        role: "Employee",
        status: "Active",
        "acceptedPolicies.policy": { $in: policyIds },
      });
      acceptancesCount = acceptedCount;
    }

    reportDetails.push({
      departmentId: dept._id,
      departmentName: dept.name,
      departmentCode: dept.code,
      scores: {
        environmental: dept.environmentalScore,
        social: dept.socialScore,
        governance: dept.governanceScore,
        overallEsg: dept.overallEsgScore,
      },
      auditKPIs: {
        totalAudits,
        completedAudits,
      },
      complianceKPIs: {
        totalIssues,
        openIssues,
        resolvedIssues,
        verifiedIssues,
      },
      policyKPIs: {
        totalActivePolicies,
        activeEmployees,
        acceptancesCount,
      },
    });
  }

  // Compile global stats
  const globalActivePolicies = await Policy.countDocuments({ status: "Active" });
  const globalTotalAudits = await Audit.countDocuments({});
  const globalCompletedAudits = await Audit.countDocuments({ status: "Completed" });
  const globalTotalIssues = await ComplianceIssue.countDocuments({});
  const globalVerifiedIssues = await ComplianceIssue.countDocuments({ status: "Verified" });

  return {
    generatedAt: new Date(),
    summary: {
      activePolicies: globalActivePolicies,
      totalAudits: globalTotalAudits,
      completedAudits: globalCompletedAudits,
      totalComplianceIssues: globalTotalIssues,
      closedComplianceIssues: globalVerifiedIssues,
    },
    departmentalDetails: reportDetails,
  };
};

module.exports = {
  generateGovernanceReport,
};
