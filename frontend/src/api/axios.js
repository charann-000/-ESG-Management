import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

axiosInstance.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      const { status } = error.response;

      if (status === 401) {
        const currentPath = window.location.pathname;
        if (currentPath !== '/login' && currentPath !== '/') {
          window.location.href = '/login';
        }
      }

      if (status === 403) {
        const data = error.response.data;
        if (data?.isPasswordChangeRequired) {
          window.location.href = '/change-password';
        }
      }
    } else if (error.request) {
      error.message = 'Network error. Please check your connection and try again.';
    } else {
      error.message = 'An unexpected error occurred. Please try again.';
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
