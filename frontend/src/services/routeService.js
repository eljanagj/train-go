import api from './api';

export const routeService = {
  getAllRoutes: async () => {
    const response = await api.get('/routes');
    return response.data;
  },

  createRoute: async (routeData) => {
    const response = await api.post('/routes', routeData);
    return response.data;
  },

  updateRoute: async (routeId, routeData) => {
    const response = await api.put(`/routes/${routeId}`, routeData);
    return response.data;
  },

  deleteRoute: async (routeId) => {
    await api.delete(`/routes/${routeId}`);
  }
}; 