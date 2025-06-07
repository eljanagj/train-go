import api from './api';

export const reviewService = {
  createReview: async (reviewData) => {
    const response = await api.post('/reviews', reviewData);
    return response.data;
  },

  getAllReviews: async (page = 1, limit = 10) => {
    const response = await api.get(`/reviews?page=${page}&limit=${limit}`);
    return response.data;
  },

  getMyReviews: async () => {
    const response = await api.get('/reviews/my-reviews');
    return response.data;
  },


  getReviewStats: async () => {
    const response = await api.get('/reviews/stats');
    return response.data;
  },


  getReview: async (reviewId) => {
    const response = await api.get(`/reviews/${reviewId}`);
    return response.data;
  },

  // Update a review - AUTHENTICATED
  updateReview: async (reviewId, reviewData) => {
    const response = await api.patch(`/reviews/${reviewId}`, reviewData);
    return response.data;
  },


  deleteReview: async (reviewId) => {
    const response = await api.delete(`/reviews/${reviewId}`);
    return response.data;
  },

  getAllReviewsForAdmin: async (page = 1, limit = 10) => {
    const response = await api.get(`/reviews/admin/all?page=${page}&limit=${limit}`);
    return response.data;
  },


  approveReview: async (reviewId) => {
    const response = await api.patch(`/reviews/${reviewId}/approve`);
    return response.data;
  },

  rejectReview: async (reviewId) => {
    const response = await api.patch(`/reviews/${reviewId}/reject`);
    return response.data;
  },

  adminDeleteReview: async (reviewId) => {
    console.log('Admin attempting to delete review with ID:', reviewId);
    try {
      const response = await api.delete(`/reviews/admin/${reviewId}`);
      console.log('Admin delete review response:', response);
      return response.data;
    } catch (error) {
      console.error('Admin error deleting review:', error);
      console.error('Admin error response:', error.response);
      throw error;
    }
  }
};
