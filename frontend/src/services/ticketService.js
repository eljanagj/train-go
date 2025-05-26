import api from './api';

export const ticketService = {
  // Create ticket for a reservation
  async createTicket(reservationId, type = 'standard') {
    try {
      const response = await api.post(`/tickets/reservation/${reservationId}`, {}, {
        params: { type }
      });
      return response.data;
    } catch (error) {
      console.error('Error creating ticket:', error);
      throw error;
    }
  },

  // Get ticket by reservation ID
  async getTicketByReservation(reservationId) {
    try {
      const response = await api.get(`/tickets/reservation/${reservationId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching ticket:', error);
      throw error;
    }
  },

  // Get ticket by ID
  async getTicketById(ticketId) {
    try {
      const response = await api.get(`/tickets/${ticketId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching ticket:', error);
      throw error;
    }
  },

  // Download ticket PDF
  async downloadTicketPdf(ticketId) {
    try {
      const response = await api.get(`/tickets/${ticketId}/download`, {
        responseType: 'blob',
        timeout: 30000 // 30 second timeout
      });
      return response.data;
    } catch (error) {
      console.error('Error downloading ticket PDF:', error);
      throw error;
    }
  },

  // Get tickets by status
  async getTicketsByStatus(status) {
    try {
      const response = await api.get(`/tickets/status/${status}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching tickets by status:', error);
      throw error;
    }
  },

  // Clean up expired tickets
  async cleanupExpiredTickets() {
    try {
      const response = await api.post('/tickets/cleanup/expired');
      return response.data;
    } catch (error) {
      console.error('Error cleaning up expired tickets:', error);
      throw error;
    }
  },

  // Download ticket PDF by reservation ID (convenience method)
  async downloadTicketByReservation(reservationId) {
    try {
      // First get the ticket for this reservation
      const ticket = await this.getTicketByReservation(reservationId);

      if (!ticket) {
        // Create ticket if it doesn't exist
        const newTicket = await this.createTicket(reservationId);
        return await this.downloadTicketPdf(newTicket.id);
      }

      return await this.downloadTicketPdf(ticket.id);
    } catch (error) {
      console.error('Error downloading ticket by reservation:', error);
      throw error;
    }
  },

  // Admin: Get all tickets
  async getAllTicketsForAdmin() {
    try {
      const response = await api.get('/tickets/admin/all');
      return response.data;
    } catch (error) {
      console.error('Error fetching all tickets for admin:', error);
      throw error;
    }
  }
};
