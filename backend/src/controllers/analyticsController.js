const analyticsService = require("../services/analyticsService");

const getOverview = async (req, res, next) => {
  try {
    const data = await analyticsService.getAdminOverview();
    return res.status(200).json({ success: true, data });
  } catch (error) { next(error); }
};

const getCarbonMonthly = async (req, res, next) => {
  try {
    const year = req.query.year ? parseInt(req.query.year) : new Date().getFullYear();
    const data = await analyticsService.getMonthlyCarbon(year);
    return res.status(200).json({ success: true, data });
  } catch (error) { next(error); }
};

const getCarbonSource = async (req, res, next) => {
  try {
    const data = await analyticsService.getCarbonBySource(req.query);
    return res.status(200).json({ success: true, data });
  } catch (error) { next(error); }
};

const getDepartmentsEsg = async (req, res, next) => {
  try {
    const data = await analyticsService.getDepartmentsEsg();
    return res.status(200).json({ success: true, data });
  } catch (error) { next(error); }
};

const getOperationsTrend = async (req, res, next) => {
  try {
    const data = await analyticsService.getOperationsTrend(req.query);
    return res.status(200).json({ success: true, data });
  } catch (error) { next(error); }
};

const getCsr = async (req, res, next) => {
  try {
    const data = await analyticsService.getCsrStats(req.query);
    return res.status(200).json({ success: true, data });
  } catch (error) { next(error); }
};

const getChallenges = async (req, res, next) => {
  try {
    const data = await analyticsService.getChallengesStats(req.query);
    return res.status(200).json({ success: true, data });
  } catch (error) { next(error); }
};

const getRewards = async (req, res, next) => {
  try {
    const data = await analyticsService.getRewardsStats();
    return res.status(200).json({ success: true, data });
  } catch (error) { next(error); }
};

const getBadges = async (req, res, next) => {
  try {
    const data = await analyticsService.getBadgesStats();
    return res.status(200).json({ success: true, data });
  } catch (error) { next(error); }
};

const getCompliance = async (req, res, next) => {
  try {
    const data = await analyticsService.getComplianceStats(req.query);
    return res.status(200).json({ success: true, data });
  } catch (error) { next(error); }
};

const getPolicies = async (req, res, next) => {
  try {
    const data = await analyticsService.getPoliciesStats();
    return res.status(200).json({ success: true, data });
  } catch (error) { next(error); }
};

const getAudits = async (req, res, next) => {
  try {
    const data = await analyticsService.getAuditsStats(req.query);
    return res.status(200).json({ success: true, data });
  } catch (error) { next(error); }
};

const getDepartmentAnalytics = async (req, res, next) => {
  try {
    const deptId = req.user.department;
    const data = await analyticsService.getManagerAnalytics(deptId);
    return res.status(200).json({ success: true, data });
  } catch (error) { next(error); }
};

const getMyAnalytics = async (req, res, next) => {
  try {
    const data = await analyticsService.getEmployeeAnalytics(req.user._id);
    return res.status(200).json({ success: true, data });
  } catch (error) { next(error); }
};

const getAuditorAnalytics = async (req, res, next) => {
  try {
    const data = await analyticsService.getAuditorAnalytics(req.user._id);
    return res.status(200).json({ success: true, data });
  } catch (error) { next(error); }
};

module.exports = {
  getOverview,
  getCarbonMonthly,
  getCarbonSource,
  getDepartmentsEsg,
  getOperationsTrend,
  getCsr,
  getChallenges,
  getRewards,
  getBadges,
  getCompliance,
  getPolicies,
  getAudits,
  getDepartmentAnalytics,
  getMyAnalytics,
  getAuditorAnalytics,
};
