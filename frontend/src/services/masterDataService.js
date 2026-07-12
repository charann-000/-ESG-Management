import axiosInstance from '../api/axios';

const masterDataService = {
  getPolicies: async () => {
    const response = await axiosInstance.get('/api/policies');
    return response.data;
  },
  createPolicy: async (data) => {
    const response = await axiosInstance.post('/api/policies', data);
    return response.data;
  },
  updatePolicy: async (id, data) => {
    const response = await axiosInstance.patch(`/api/policies/${id}`, data);
    return response.data;
  },
  deletePolicy: async (id) => {
    const response = await axiosInstance.delete(`/api/policies/${id}`);
    return response.data;
  },

  getEmissionFactors: async () => {
    const response = await axiosInstance.get('/api/emission-factors');
    return response.data;
  },
  createEmissionFactor: async (data) => {
    const response = await axiosInstance.post('/api/emission-factors', data);
    return response.data;
  },
  updateEmissionFactor: async (id, data) => {
    const response = await axiosInstance.patch(`/api/emission-factors/${id}`, data);
    return response.data;
  },
  deleteEmissionFactor: async (id) => {
    const response = await axiosInstance.delete(`/api/emission-factors/${id}`);
    return response.data;
  },

  getCategories: async () => {
    // Categories endpoint is mock-backed as no router is mounted in app.js
    return {
      success: true,
      data: [
        { id: 1, name: 'Purchase', module: 'Environmental' },
        { id: 2, name: 'Electricity', module: 'Environmental' },
        { id: 3, name: 'CSR Activity', module: 'Social' },
        { id: 4, name: 'Compliance Issue', module: 'Governance' },
      ],
    };
  },
};

export default masterDataService;
