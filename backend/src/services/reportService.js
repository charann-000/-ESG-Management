const PDFDocument = require("pdfkit");
const ExcelJS = require("exceljs");
const Policy = require("../models/Policy");
const Audit = require("../models/Audit");
const ComplianceIssue = require("../models/ComplianceIssue");
const Department = require("../models/Department");
const User = require("../models/User");
const Operation = require("../models/Operation");
const CSRActivity = require("../models/CSRActivity");
const Challenge = require("../models/Challenge");

/**
 * Centrally manages PDF rendering.
 */
const exportPdfReport = (res, title, data) => {
  const doc = new PDFDocument({ margin: 50 });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=${title.toLowerCase().replace(/\s+/g, "_")}.pdf`
  );

  doc.pipe(res);

  // Drawing Header Branding
  doc.fillColor("#4CAF50").fontSize(26).text("EcoSphere ESG Platform", { align: "center" });
  doc.fillColor("#555555").fontSize(10).text("Enterprise Analytics & Reporting Engine", { align: "center" });
  doc.moveDown(0.8);
  doc.fillColor("#333333").fontSize(18).text(title, { align: "center" });
  doc.moveDown(1.5);

  // Line divider
  doc.strokeColor("#cccccc").lineWidth(1).moveTo(50, 125).lineTo(560, 125).stroke();
  doc.moveDown(1);

  doc.fillColor("#888888").fontSize(8).text(`Generated: ${new Date().toLocaleString()}`, { align: "right" });
  doc.moveDown(2);

  // Map values onto document
  const renderItem = (key, val, indent) => {
    if (typeof val === "object" && val !== null) {
      if (Array.isArray(val)) {
        doc.fillColor("#388E3C").fontSize(12).text(`${" ".repeat(indent)}• ${key.toUpperCase()}:`);
        doc.moveDown(0.2);
        val.forEach((item, idx) => {
          doc.fillColor("#555555").fontSize(10).text(`${" ".repeat(indent + 2)}[Index: ${idx}]`);
          renderItem("", item, indent + 4);
          doc.moveDown(0.3);
        });
      } else {
        doc.fillColor("#2E7D32").fontSize(12).text(`${" ".repeat(indent)}■ ${key.toUpperCase()}:`);
        doc.moveDown(0.3);
        Object.keys(val).forEach((k) => renderItem(k, val[k], indent + 4));
        doc.moveDown(0.5);
      }
    } else {
      const displayKey = key ? `${key}: ` : "";
      doc.fillColor("#333333").fontSize(10).text(`${" ".repeat(indent)}${displayKey}${val}`);
    }
  };

  Object.keys(data).forEach((key) => renderItem(key, data[key], 0));

  doc.end();
};

/**
 * Centrally manages Excel xlsx streaming.
 */
const exportExcelReport = async (res, title, columns, rows) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(title);

  worksheet.columns = columns.map((col) => ({
    header: col.header,
    key: col.key,
    width: col.width || 20,
  }));

  worksheet.addRows(rows);

  // Format header styles
  worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFF" } };
  worksheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "4CAF50" },
  };

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=${title.toLowerCase().replace(/\s+/g, "_")}.xlsx`
  );

  await workbook.xlsx.write(res);
  res.end();
};

/**
 * Filter generator based on query inputs.
 */
const buildFilters = (query) => {
  const match = {};
  if (query.department) {
    match.department = query.department;
  }
  if (query.startDate || query.endDate) {
    match.createdAt = {};
    if (query.startDate) match.createdAt.$gte = new Date(query.startDate);
    if (query.endDate) match.createdAt.$lte = new Date(query.endDate);
  }
  return match;
};

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

// ==========================================
// PDF GENERATION SERVICES
// ==========================================

const generateEsgPdf = async (res, query) => {
  const depts = await Department.find({ status: "Active" }).select(
    "name code environmentalScore socialScore governanceScore overallEsgScore"
  );

  const reportData = {
    overview: {
      totalActiveDepartments: depts.length,
      averageOverallEsgScore: Math.round(depts.reduce((acc, d) => acc + d.overallEsgScore, 0) / depts.length || 0),
    },
    departmentalRatings: depts.map((d) => ({
      name: d.name,
      code: d.code,
      environmental: d.environmentalScore,
      social: d.socialScore,
      governance: d.governanceScore,
      overall: d.overallEsgScore,
    })),
  };

  exportPdfReport(res, "ESG Corporate Performance Report", reportData);
};

const generateEnvironmentPdf = async (res, query) => {
  const filters = buildFilters(query);
  filters.status = "Active";

  const totalCarbonResult = await Operation.aggregate([
    { $match: filters },
    { $group: { _id: null, total: { $sum: "$carbonEmission" } } },
  ]);

  const sourceBreakdown = await Operation.aggregate([
    { $match: filters },
    { $group: { _id: "$type", total: { $sum: "$carbonEmission" } } },
  ]);

  const reportData = {
    overview: {
      totalCarbonEmissionsKg: totalCarbonResult[0]?.total || 0,
      totalLoggedOperationsCount: await Operation.countDocuments(filters),
    },
    sourceDistribution: sourceBreakdown.map((s) => ({
      source: s._id,
      emissionsKg: s.total,
    })),
  };

  exportPdfReport(res, "Environmental Performance Report", reportData);
};

const generateSocialPdf = async (res, query) => {
  const activities = await CSRActivity.find({ status: { $ne: "Cancelled" } });
  const challenges = await Challenge.find({ status: { $ne: "Cancelled" } });

  const reportData = {
    csrEngagementIndex: activities.map((act) => ({
      activityTitle: act.title,
      date: act.date.toDateString(),
      location: act.location,
      totalParticipants: act.participants.length,
      approvedParticipations: act.participants.filter((p) => p.status === "Approved").length,
    })),
    challengesEngagementIndex: challenges.map((ch) => ({
      challengeTitle: ch.title,
      scope: ch.scope,
      totalJoins: ch.participants.length,
      completedCount: ch.participants.filter((p) => p.status === "Completed").length,
    })),
  };

  exportPdfReport(res, "Social Engagement Index Report", reportData);
};

const generateGovernancePdf = async (res, query) => {
  const activePolicies = await Policy.find({ status: "Active" });
  const audits = await Audit.find();

  const reportData = {
    policiesOverview: {
      totalActivePolicies: activePolicies.length,
    },
    corporatePoliciesList: activePolicies.map((p) => ({
      title: p.title,
      status: p.status,
      publishedAt: p.createdAt.toDateString(),
    })),
    auditsCoverage: audits.map((a) => ({
      title: a.title,
      status: a.status,
      dateRange: `${a.startDate.toDateString()} - ${a.endDate.toDateString()}`,
      findingsExcerpt: a.findings || "No findings recorded",
    })),
  };

  exportPdfReport(res, "Governance Adherence Report", reportData);
};

const generateCarbonPdf = async (res, query) => {
  const filters = buildFilters(query);
  filters.status = "Active";

  const operations = await Operation.find(filters)
    .populate("department", "name")
    .populate("recordedBy", "name")
    .sort({ date: -1 })
    .limit(50);

  const reportData = {
    operationsAuditedList: operations.map((op) => ({
      date: op.date.toDateString(),
      department: op.department.name,
      category: op.type,
      emissionsKg: op.carbonEmission,
      loggedBy: op.recordedBy?.name || "Unknown",
    })),
  };

  exportPdfReport(res, "Carbon Emissions Inventory Report", reportData);
};

const generateDepartmentPdf = async (res, id, query) => {
  const department = await Department.findById(id).populate("manager", "name email");
  if (!department) {
    throw new Error("Department not found");
  }

  const reportData = {
    departmentDetails: {
      name: department.name,
      code: department.code,
      manager: department.manager?.name || "Unassigned",
      scores: {
        environmental: department.environmentalScore,
        social: department.socialScore,
        governance: department.governanceScore,
        overallEsg: department.overallEsgScore,
      },
    },
    operationsLoggedCount: await Operation.countDocuments({ department: id, status: "Active" }),
    complianceIssuesLogged: await ComplianceIssue.countDocuments({ department: id }),
  };

  exportPdfReport(res, `Department ESG Audit Report - ${department.name}`, reportData);
};

const generateCsrPdf = async (res, query) => {
  const activities = await CSRActivity.find({ status: { $ne: "Cancelled" } }).populate("department", "name");
  
  const reportData = {
    csrActivities: activities.map((act) => ({
      title: act.title,
      department: act.department.name,
      location: act.location,
      rewards: `XP: ${act.xpReward}, Coins: ${act.coinReward}`,
      participantsCount: act.participants.length,
    })),
  };

  exportPdfReport(res, "CSR Engagement Report", reportData);
};

const generateChallengesPdf = async (res, query) => {
  const challenges = await Challenge.find({ status: { $ne: "Cancelled" } });

  const reportData = {
    challenges: challenges.map((ch) => ({
      title: ch.title,
      scope: ch.scope,
      rewards: `XP: ${ch.xpReward}`,
      participantsJoinedCount: ch.participants.length,
    })),
  };

  exportPdfReport(res, "Challenges Participation Report", reportData);
};

const generateCompliancePdf = async (res, query) => {
  const issues = await ComplianceIssue.find().populate("department", "name");

  const reportData = {
    complianceIssues: issues.map((i) => ({
      title: i.title,
      department: i.department.name,
      severity: i.severity,
      status: i.status,
      resolvedAt: i.resolvedAt ? i.resolvedAt.toDateString() : "Pending",
    })),
  };

  exportPdfReport(res, "Compliance Violations Report", reportData);
};

const generateAuditsPdf = async (res, query) => {
  const audits = await Audit.find().populate("department", "name").populate("auditedBy", "name");

  const reportData = {
    audits: audits.map((a) => ({
      title: a.title,
      department: a.department.name,
      status: a.status,
      auditedBy: a.auditedBy.name,
      findings: a.findings || "No findings recorded",
    })),
  };

  exportPdfReport(res, "Governance Audits History Report", reportData);
};

const generateEmployeesPdf = async (res, query) => {
  const employees = await User.find({ role: "Employee", status: "Active" }).populate("department", "name");

  const reportData = {
    employeesRankings: employees.map((emp) => ({
      name: emp.name,
      email: emp.email,
      department: emp.department?.name || "Unassigned",
      xp: emp.xp,
      coins: emp.coins,
      badgesEarnedCount: emp.badges.length,
    })),
  };

  exportPdfReport(res, "Employee ESG Performance Report", reportData);
};

// ==========================================
// EXCEL GENERATION SERVICES
// ==========================================

const generateEsgExcel = async (res, query) => {
  const depts = await Department.find({ status: "Active" });

  const cols = [
    { header: "Department Name", key: "name" },
    { header: "Code", key: "code" },
    { header: "Environmental Score", key: "env" },
    { header: "Social Score", key: "soc" },
    { header: "Governance Score", key: "gov" },
    { header: "Overall ESG Score", key: "overall" },
  ];

  const rows = depts.map((d) => ({
    name: d.name,
    code: d.code,
    env: d.environmentalScore,
    soc: d.socialScore,
    gov: d.governanceScore,
    overall: d.overallEsgScore,
  }));

  await exportExcelReport(res, "ESG Performance Data", cols, rows);
};

const generateCarbonExcel = async (res, query) => {
  const filters = buildFilters(query);
  filters.status = "Active";

  const operations = await Operation.find(filters)
    .populate("department", "name")
    .populate("recordedBy", "name");

  const cols = [
    { header: "Date", key: "date" },
    { header: "Department", key: "department" },
    { header: "Category", key: "category" },
    { header: "Quantity", key: "quantity" },
    { header: "Unit", key: "unit" },
    { header: "Cost ($)", key: "cost" },
    { header: "Carbon Emission (kg)", key: "emissions" },
    { header: "Logged By", key: "loggedBy" },
  ];

  const rows = operations.map((op) => ({
    date: op.date.toLocaleDateString(),
    department: op.department.name,
    category: op.type,
    quantity: op.quantity,
    unit: op.unit,
    cost: op.cost,
    emissions: op.carbonEmission,
    loggedBy: op.recordedBy?.name || "Unknown",
  }));

  await exportExcelReport(res, "Carbon Emissions Inventory", cols, rows);
};

const generateOperationsExcel = async (res, query) => {
  await generateCarbonExcel(res, query); // Shares identical grid logic
};

const generateComplianceExcel = async (res, query) => {
  const issues = await ComplianceIssue.find().populate("department", "name");

  const cols = [
    { header: "Title", key: "title" },
    { header: "Description", key: "description" },
    { header: "Department", key: "department" },
    { header: "Severity", key: "severity" },
    { header: "Status", key: "status" },
    { header: "Resolved At", key: "resolvedAt" },
  ];

  const rows = issues.map((i) => ({
    title: i.title,
    description: i.description,
    department: i.department.name,
    severity: i.severity,
    status: i.status,
    resolvedAt: i.resolvedAt ? i.resolvedAt.toLocaleDateString() : "Pending",
  }));

  await exportExcelReport(res, "Compliance Audit Data", cols, rows);
};

const generateEmployeesExcel = async (res, query) => {
  const employees = await User.find({ role: "Employee", status: "Active" }).populate("department", "name");

  const cols = [
    { header: "Name", key: "name" },
    { header: "Email", key: "email" },
    { header: "Department", key: "department" },
    { header: "XP Rating", key: "xp" },
    { header: "Coins Saved", key: "coins" },
    { header: "Badges Earned", key: "badges" },
  ];

  const rows = employees.map((emp) => ({
    name: emp.name,
    email: emp.email,
    department: emp.department?.name || "Unassigned",
    xp: emp.xp,
    coins: emp.coins,
    badges: emp.badges.length,
  }));

  await exportExcelReport(res, "Employee ESG Data", cols, rows);
};

const generateChallengesExcel = async (res, query) => {
  const challenges = await Challenge.find();

  const cols = [
    { header: "Title", key: "title" },
    { header: "Scope", key: "scope" },
    { header: "XP Reward", key: "xpReward" },
    { header: "Status", key: "status" },
    { header: "Total Joins", key: "joins" },
  ];

  const rows = challenges.map((ch) => ({
    title: ch.title,
    scope: ch.scope,
    xpReward: ch.xpReward,
    status: ch.status,
    joins: ch.participants.length,
  }));

  await exportExcelReport(res, "Challenges Adherence Data", cols, rows);
};

const generateCsrExcel = async (res, query) => {
  const activities = await CSRActivity.find();

  const cols = [
    { header: "Title", key: "title" },
    { header: "Location", key: "location" },
    { header: "XP Reward", key: "xpReward" },
    { header: "Coins Reward", key: "coinReward" },
    { header: "Total Participants", key: "participants" },
  ];

  const rows = activities.map((act) => ({
    title: act.title,
    location: act.location,
    xpReward: act.xpReward,
    coinReward: act.coinReward,
    participants: act.participants.length,
  }));

  await exportExcelReport(res, "CSR Engagement Data", cols, rows);
};

module.exports = {
  // Legacy
  generateGovernanceReport,
  // PDF
  generateEsgPdf,
  generateEnvironmentPdf,
  generateSocialPdf,
  generateGovernancePdf,
  generateCarbonPdf,
  generateDepartmentPdf,
  generateCsrPdf,
  generateChallengesPdf,
  generateCompliancePdf,
  generateAuditsPdf,
  generateEmployeesPdf,
  // Excel
  generateEsgExcel,
  generateCarbonExcel,
  generateOperationsExcel,
  generateComplianceExcel,
  generateEmployeesExcel,
  generateChallengesExcel,
  generateCsrExcel,
};
