import api from './api';

const discountService = {
  // User endpoints
  getUserDiscountCode: async (userId) => {
    try {
      const response = await api.get(`/discount-code/user/${userId}`);
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        return null; // User has no discount code
      }
      throw error;
    }
  },

  getUserEligibility: async (userId) => {
    try {
      const response = await api.get(`/discount-code/user/${userId}/eligibility`);
      return response.data;
    } catch (error) {
      console.error('Error getting discount eligibility:', error);
      throw error;
    }
  },

  validateDiscountCode: async (code) => {
    try {
      const response = await api.get(`/discount-code/validate/${code}`);
      return response.data;
    } catch (error) {
      console.error('Error validating discount code:', error);
      throw error;
    }
  },

  applyDiscount: async (discountCode, originalPrice, userId = null) => {
    try {
      const response = await api.post('/discount-code/apply', {
        discountCode,
        originalPrice,
        userId
      });
      return response.data;
    } catch (error) {
      console.error('Error applying discount:', error);
      throw error;
    }
  },

  checkAndUpdateUserDiscount: async (userId) => {
    try {
      const response = await api.post(`/discount-code/check-user/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error checking user discount:', error);
      throw error;
    }
  },

  refreshUserDiscount: async (userId) => {
    try {
      const response = await api.post(`/discount-code/refresh-user/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Error refreshing user discount:', error);
      throw error;
    }
  },

  // Admin endpoints
  getAllDiscountCodes: async () => {
    try {
      const response = await api.get('/discount-code');
      return response.data;
    } catch (error) {
      console.error('Error getting all discount codes:', error);
      throw error;
    }
  },

  deleteDiscountCode: async (id) => {
    try {
      const response = await api.delete(`/discount-code/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting discount code:', error);
      throw error;
    }
  },

  cleanupExpiredCodes: async () => {
    try {
      const response = await api.delete('/discount-code/expired/cleanup');
      return response.data;
    } catch (error) {
      console.error('Error cleaning up expired codes:', error);
      throw error;
    }
  },

  updateDiscountCode: async (id, updateData) => {
    try {
      const response = await api.patch(`/discount-code/${id}`, updateData);
      return response.data;
    } catch (error) {
      console.error('Error updating discount code:', error);
      throw error;
    }
  }
};

export default discountService; 