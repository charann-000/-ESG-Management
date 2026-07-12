import axiosInstance from '../api/axios';

const analyticsService = {
  getOverview: async () => {
    const response = await axiosInstance.get('/api/analytics/overview');
    return response.data;
  },
  getCarbonMonthly: async (year) => {
    const response = await axiosInstance.get('/api/analytics/carbon/monthly', { params: { year } });
    return response.data;
  },
  getCarbonSource: async (params) => {
    const response = await axiosInstance.get('/api/analytics/carbon/source', { params });
    return response.data;
  },
  getDepartmentsEsg: async () => {
    const response = await axiosInstance.get('/api/analytics/departments/esg');
    return response.data;
  },
  getOperationsTrend: async (params) => {
    const response = await axiosInstance.get('/api/analytics/operations/trend', { params });
    return response.data;
  },
  getCsr: async (params) => {
    const response = await axiosInstance.get('/api/analytics/csr', { params });
    return response.data;
  },
  getChallenges: async (params) => {
    const response = await axiosInstance.get('/api/analytics/challenges', { params });
    return response.data;
  },
  getRewards: async () => {
    const response = await axiosInstance.get('/api/analytics/rewards');
    return response.data;
  },
  getBadges: async () => {
    const response = await axiosInstance.get('/api/analytics/badges');
    return response.data;
  },
  getCompliance: async (params) => {
    const response = await axiosInstance.get('/api/analytics/compliance', { params });
    return response.data;
  },
  getPolicies: async () => {
    const response = await axiosInstance.get('/api/analytics/policies');
    return response.data;
  },
  getAudits: async (params) => {
    const response = await axiosInstance.get('/api/analytics/audits', { params });
    return response.data;
  },
};

export default analyticsService;
