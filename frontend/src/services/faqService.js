import api from './api';

export const faqService = {
  getAllFaqs: async () => {
    const response = await api.get('/faqs');
    return response.data;
  },

  getAllFaqsForAdmin: async () => {
    const response = await api.get('/faqs/admin/all');
    return response.data;
  },

  getFaq: async (id) => {
    const response = await api.get(`/faqs/${id}`);
    return response.data;
  },

  createFaq: async (faqData) => {
    const response = await api.post('/faqs', faqData);
    return response.data;
  },

  updateFaq: async (id, faqData) => {
    const response = await api.patch(`/faqs/${id}`, faqData);
    return response.data;
  },

  deleteFaq: async (id) => {
    const response = await api.delete(`/faqs/${id}`);
    return response.data;
  },
}; 