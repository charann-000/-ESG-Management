import axiosInstance from '../api/axios';

const rewardService = {
  getRewards: async () => {
    const response = await axiosInstance.get('/api/rewards');
    return response.data;
  },
  createReward: async (data) => {
    const response = await axiosInstance.post('/api/rewards', data);
    return response.data;
  },
  redeemReward: async (id) => {
    const response = await axiosInstance.post(`/api/rewards/${id}/redeem`);
    return response.data;
  },
  getBadges: async () => {
    const response = await axiosInstance.get('/api/badges');
    return response.data;
  },
  createBadge: async (data) => {
    const response = await axiosInstance.post('/api/badges', data);
    return response.data;
  },
};

export default rewardService;
