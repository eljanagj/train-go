import api from './api';

export const maintenanceService = {
  getAllMaintenance: async () => {
    try {
      const response = await api.get('/maintenance');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getMaintenanceById: async (id) => {
    try {
      const response = await api.get(`/maintenance/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getMaintenanceByPriority: async (priority) => {
    try {
      const response = await api.get(`/maintenance/priority/${priority}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getMaintenanceByDateRange: async (startDate, endDate) => {
    try {
      const response = await api.get('/maintenance/date-range', {
        params: { startDate, endDate }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getUpcomingMaintenance: async () => {
    try {
      const response = await api.get('/maintenance/upcoming');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getMaintenanceStats: async () => {
    try {
      const response = await api.get('/maintenance/stats');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getMaintenanceTrends: async () => {
    try {
      const response = await api.get('/maintenance/trends');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getRecentActivity: async () => {
    try {
      const response = await api.get('/maintenance/recent');
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  createMaintenance: async (maintenanceData) => {
    try {
      const response = await api.post('/maintenance', maintenanceData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  updateMaintenance: async (id, maintenanceData) => {
    try {
      const response = await api.patch(`/maintenance/${id}`, maintenanceData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  updateMaintenanceStatus: async (id, status) => {
    try {
      const response = await api.patch(`/maintenance/${id}/status`, { status });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  deleteMaintenance: async (id) => {
    try {
      const response = await api.delete(`/maintenance/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}; 