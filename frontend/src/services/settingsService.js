// Company profile and preferences settings service
const settingsService = {
  getSettings: async () => {
    // Return default settings values as no dedicated backend settings route exists
    return {
      companyName: 'EcoSphere Industries Pvt. Ltd.',
      fiscalYearStart: 'April',
      currency: 'INR',
      notificationEmail: 'esg-admin@ecosphere.com',
    };
  },
  saveSettings: async (settings) => {
    return { success: true, data: settings };
  },
};

export default settingsService;
