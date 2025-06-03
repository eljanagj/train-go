import api from './api';

export const reservationService = {
  // Get available seats for a schedule
  getAvailableSeats: async (scheduleId) => {
    const response = await api.get(`/reservations/available-seats/${scheduleId}`);
    return response.data;
  },

  // Create a new reservation
  async createReservation(reservationData) {
    try {
      const response = await api.post('/reservations', reservationData);
      return response.data;
    } catch (error) {
      console.error('Error creating reservation:', error);
      throw error;
    }
  },

  // Get all reservations for the current user
  async getUserReservations() {
    try {
      const response = await api.get('/reservations/user');
      return response.data;
    } catch (error) {
      console.error('Error fetching user reservations:', error);
      throw error;
    }
  },

  // Get a specific reservation by ID
  async getReservationById(id) {
    try {
      const response = await api.get(`/reservations/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching reservation:', error);
      throw error;
    }
  },

  // Alias for getReservationById for backward compatibility
  async getReservation(id) {
    return this.getReservationById(id);
  },

  // Cancel a reservation
  async cancelReservation(id) {
    try {
      const response = await api.post(`/reservations/${id}/cancel`);
      return response.data;
    } catch (error) {
      console.error('Error cancelling reservation:', error);
      throw error;
    }
  },

  // Confirm a reservation
  confirmReservation: async (reservationId) => {
    const response = await api.post(`/reservations/${reservationId}/confirm`);
    return response.data;
  },

  // Update payment status
  async updatePaymentStatus(reservationId, paymentIntentId) {
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

  // Get all reservations (admin only)
  async getAllReservations() {
    try {
      const response = await api.get('/reservations/admin/all');
      return response.data;
    } catch (error) {
      console.error('Error fetching all reservations:', error);
      throw error;
    }
  },

  // Get reservations by schedule ID
  async getReservationsBySchedule(scheduleId) {
    try {
      const response = await api.get(`/reservations/schedule/${scheduleId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching reservations by schedule:', error);
      throw error;
    }
  },

  // Get all reservations for admin
  async getAllReservationsForAdmin() {
    try {
      const response = await api.get('/reservations/admin/all');
      return response.data;
    } catch (error) {
      console.error('Error fetching all reservations for admin:', error);
      throw error;
    }
  }
};