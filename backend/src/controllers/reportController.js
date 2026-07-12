const reportService = require("../services/reportService");

/**
 * Handles GET /reports/governance.
 * Compiles a comprehensive policy adherence, audit coverage, and compliance issue stats report.
 */
const getGovernanceReport = async (req, res, next) => {
  try {
    const report = await reportService.generateGovernanceReport(req.query);
    return res.status(200).json({
      success: true,
      message: "Governance compliance report compiled successfully.",
      data: report,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getGovernanceReport,
};
