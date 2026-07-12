const reportService = require("../services/reportService");

// ==========================================
// PDF EXPORTS
// ==========================================

const exportEsgPdf = async (req, res, next) => {
  try {
    await reportService.generateEsgPdf(res, req.query);
  } catch (error) { next(error); }
};

const exportEnvironmentPdf = async (req, res, next) => {
  try {
    await reportService.generateEnvironmentPdf(res, req.query);
  } catch (error) { next(error); }
};

const exportSocialPdf = async (req, res, next) => {
  try {
    await reportService.generateSocialPdf(res, req.query);
  } catch (error) { next(error); }
};

const exportGovernancePdf = async (req, res, next) => {
  try {
    await reportService.generateGovernancePdf(res, req.query);
  } catch (error) { next(error); }
};

const exportCarbonPdf = async (req, res, next) => {
  try {
    if (req.user.role === "Department Manager") {
      req.query.department = req.user.department.toString();
    }
    await reportService.generateCarbonPdf(res, req.query);
  } catch (error) { next(error); }
};

const exportDepartmentPdf = async (req, res, next) => {
  try {
    const deptId = req.params.id;
    if (req.user.role === "Department Manager" && deptId !== req.user.department.toString()) {
      return res.status(403).json({ success: false, message: "Access denied. Scoped to your department only." });
    }
    await reportService.generateDepartmentPdf(res, deptId, req.query);
  } catch (error) { next(error); }
};

const exportCsrPdf = async (req, res, next) => {
  try {
    await reportService.generateCsrPdf(res, req.query);
  } catch (error) { next(error); }
};

const exportChallengesPdf = async (req, res, next) => {
  try {
    await reportService.generateChallengesPdf(res, req.query);
  } catch (error) { next(error); }
};

const exportCompliancePdf = async (req, res, next) => {
  try {
    if (req.user.role === "Department Manager") {
      req.query.department = req.user.department.toString();
    }
    await reportService.generateCompliancePdf(res, req.query);
  } catch (error) { next(error); }
};

const exportAuditsPdf = async (req, res, next) => {
  try {
    if (req.user.role === "Department Manager") {
      req.query.department = req.user.department.toString();
    }
    await reportService.generateAuditsPdf(res, req.query);
  } catch (error) { next(error); }
};

const exportEmployeesPdf = async (req, res, next) => {
  try {
    await reportService.generateEmployeesPdf(res, req.query);
  } catch (error) { next(error); }
};

// ==========================================
// EXCEL EXPORTS
// ==========================================

const exportEsgExcel = async (req, res, next) => {
  try {
    await reportService.generateEsgExcel(res, req.query);
  } catch (error) { next(error); }
};

const exportCarbonExcel = async (req, res, next) => {
  try {
    if (req.user.role === "Department Manager") {
      req.query.department = req.user.department.toString();
    }
    await reportService.generateCarbonExcel(res, req.query);
  } catch (error) { next(error); }
};

const exportOperationsExcel = async (req, res, next) => {
  try {
    if (req.user.role === "Department Manager") {
      req.query.department = req.user.department.toString();
    }
    await reportService.generateOperationsExcel(res, req.query);
  } catch (error) { next(error); }
};

const exportComplianceExcel = async (req, res, next) => {
  try {
    if (req.user.role === "Department Manager") {
      req.query.department = req.user.department.toString();
    }
    await reportService.generateComplianceExcel(res, req.query);
  } catch (error) { next(error); }
};

const exportEmployeesExcel = async (req, res, next) => {
  try {
    await reportService.generateEmployeesExcel(res, req.query);
  } catch (error) { next(error); }
};

const exportChallengesExcel = async (req, res, next) => {
  try {
    await reportService.generateChallengesExcel(res, req.query);
  } catch (error) { next(error); }
};

const exportCsrExcel = async (req, res, next) => {
  try {
    await reportService.generateCsrExcel(res, req.query);
  } catch (error) { next(error); }
};

module.exports = {
  exportEsgPdf,
  exportEnvironmentPdf,
  exportSocialPdf,
  exportGovernancePdf,
  exportCarbonPdf,
  exportDepartmentPdf,
  exportCsrPdf,
  exportChallengesPdf,
  exportCompliancePdf,
  exportAuditsPdf,
  exportEmployeesPdf,
  exportEsgExcel,
  exportCarbonExcel,
  exportOperationsExcel,
  exportComplianceExcel,
  exportEmployeesExcel,
  exportChallengesExcel,
  exportCsrExcel,
};
