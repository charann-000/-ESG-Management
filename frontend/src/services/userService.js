import axiosInstance from '../api/axios';

const userService = {
  getUsers: async (params) => {
    const response = await axiosInstance.get('/api/users', { params });
    return response.data;
  },
  getUserById: async (id) => {
    const response = await axiosInstance.get(`/api/users/${id}`);
    return response.data;
  },
  createUser: async (data) => {
    const response = await axiosInstance.post('/api/users', data);
    return response.data;
  },
  updateUser: async (id, data) => {
    const response = await axiosInstance.patch(`/api/users/${id}`, data);
    return response.data;
  },
  deactivateUser: async (id) => {
    const response = await axiosInstance.patch(`/api/users/${id}/deactivate`);
    return response.data;
  },
};

export default userService;
