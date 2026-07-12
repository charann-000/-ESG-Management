import axiosInstance from '../api/axios';

const AUTH_ENDPOINTS = {
  LOGIN: '/api/auth/login',
  LOGOUT: '/api/auth/logout',
  CHANGE_PASSWORD: '/api/auth/change-password',
  ME: '/api/auth/me',
};

export const authService = {
  async login(email, password) {
    const response = await axiosInstance.post(AUTH_ENDPOINTS.LOGIN, {
      email,
      password,
    });
    return response.data;
  },

  async logout() {
    const response = await axiosInstance.post(AUTH_ENDPOINTS.LOGOUT);
    return response.data;
  },

  async changePassword(oldPassword, newPassword) {
    const response = await axiosInstance.post(AUTH_ENDPOINTS.CHANGE_PASSWORD, {
      oldPassword,
      newPassword,
    });
    return response.data;
  },

  async getCurrentUser() {
    const response = await axiosInstance.get(AUTH_ENDPOINTS.ME);
    return response.data;
  },
};

export default authService;
