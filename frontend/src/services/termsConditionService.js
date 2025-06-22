import api from './api';

export const termsConditionService = {
  getAllTerms: async () => {
    const response = await api.get('/terms-conditions');
    return response.data;
  },

  getTerm: async (id) => {
    const response = await api.get(`/terms-conditions/${id}`);
    return response.data;
  },

  createTerm: async (data) => {
    const response = await api.post('/terms-conditions', data);
    return response.data;
  },

  updateTerm: async (id, data) => {
    const response = await api.patch(`/terms-conditions/${id}`, data);
    return response.data;
  },

  deleteTerm: async (id) => {
    const response = await api.delete(`/terms-conditions/${id}`);
    return response.data;
  },
}; 