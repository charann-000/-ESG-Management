import axiosInstance from '../api/axios';

const reportService = {
  exportEsgPdf: async () => {
    const response = await axiosInstance.get('/api/reports/esg/pdf', {
      responseType: 'blob',
    });
    return response.data;
  },
  exportEsgExcel: async () => {
    const response = await axiosInstance.get('/api/reports/esg/excel', {
      responseType: 'blob',
    });
    return response.data;
  },
};

export default reportService;
