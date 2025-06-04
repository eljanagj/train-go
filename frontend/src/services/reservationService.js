import api from './api';

export const reservationService = {
  // Get available seats for a schedule
  getAvailableSeats: async (scheduleId) => {
    const response = await api.get(`/reservations/available-seats/${scheduleId}`);
    return response.data;
  },

  // Create a new reservation
  createReservation: async (reservationData) => {
    const response = await api.post('/reservations', reservationData);
    return response.data;
  },

  // Get all reservations for the current user
  getUserReservations: async () => {
    const response = await api.get('/reservations');
    return response.data;
  },

  // Get a specific reservation
  getReservation: async (reservationId) => {
    const response = await api.get(`/reservations/${reservationId}`);
    return response.data;
  },

  // Cancel a reservation
  cancelReservation: async (reservationId) => {
    const response = await api.post(`/reservations/${reservationId}/cancel`);
    return response.data;
  },

  // Confirm a reservation
  confirmReservation: async (reservationId) => {
    const response = await api.post(`/reservations/${reservationId}/confirm`);
    return response.data;
  },

  // Update payment status
  updatePaymentStatus: async (reservationId, paymentIntentId) => {
    try {
      const response = await api.post(`/reservations/${reservationId}/update-payment`, {
        paymentIntentId
      });
      return response.data;
    } catch (error) {
      console.error('Error updating payment status:', error);
      throw error;
    }
  },

  // Admin: Get all reservations
  getAllReservationsForAdmin: async () => {
    const response = await api.get('/reservations/admin/all');
    return response.data;
  }
};