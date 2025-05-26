import api from './api';

export const paymentService = {
  // Create payment for a reservation
  async createPayment(reservationId, amount, currency = 'eur') {
    try {
      const response = await api.post(`/payments/reservation/${reservationId}`, {
        amount,
        currency
      });
      return response.data;
    } catch (error) {
      console.error('Error creating payment:', error);
      throw error;
    }
  },

  // Get payment by reservation ID
  async getPaymentByReservation(reservationId) {
    try {
      const response = await api.get(`/payments/reservation/${reservationId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching payment:', error);
      throw error;
    }
  },

  // Get payment by ID
  async getPaymentById(paymentId) {
    try {
      const response = await api.get(`/payments/${paymentId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching payment:', error);
      throw error;
    }
  },

  // Update payment status
  async updatePaymentStatus(paymentId, paymentIntentId) {
    try {
      const response = await api.post(`/payments/${paymentId}/update-status`, {
        paymentIntentId
      });
      return response.data;
    } catch (error) {
      console.error('Error updating payment status:', error);
      throw error;
    }
  },

  // Create payment intent (legacy endpoint for backward compatibility)
  async createPaymentIntent(amount, currency = 'eur') {
    try {
      const response = await api.post('/payments/create-payment-intent', {
        amount,
        currency
      });
      return response.data;
    } catch (error) {
      console.error('Error creating payment intent:', error);
      throw error;
    }
  },

  // Create payment intent for reservation (legacy endpoint)
  async createPaymentIntentForReservation(reservationId) {
    try {
      const response = await api.get(`/payments/create-payment-intent/${reservationId}`);
      return response.data;
    } catch (error) {
      console.error('Error creating payment intent for reservation:', error);
      throw error;
    }
  },

  // Admin: Get all payments
  async getAllPaymentsForAdmin() {
    try {
      const response = await api.get('/payments/admin/all');
      return response.data;
    } catch (error) {
      console.error('Error fetching all payments for admin:', error);
      throw error;
    }
  },

  // Get payment intent
  async getPaymentIntent(paymentIntentId) {
    try {
      const response = await api.get(`/payments/payment-intent/${paymentIntentId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching payment intent:', error);
      throw error;
    }
  }
};
