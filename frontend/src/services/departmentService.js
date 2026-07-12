import axiosInstance from '../api/axios';

const departmentService = {
  getDepartments: async (params) => {
    const response = await axiosInstance.get('/api/departments', { params });
    return response.data;
  },
  getDepartmentById: async (id) => {
    const response = await axiosInstance.get(`/api/departments/${id}`);
    return response.data;
  },
  createDepartment: async (data) => {
    const response = await axiosInstance.post('/api/departments', data);
    return response.data;
  },
  updateDepartment: async (id, data) => {
    const response = await axiosInstance.patch(`/api/departments/${id}`, data);
    return response.data;
  },
  deleteDepartment: async (id) => {
    const response = await axiosInstance.delete(`/api/departments/${id}`);
    return response.data;
  },
};

export default departmentService;
