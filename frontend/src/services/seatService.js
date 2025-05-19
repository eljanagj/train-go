import api from './api';

export const seatService = {
  createSeatsForTrain: async (trainId, seatConfig) => {
    const response = await api.post(`/seats/train/${trainId}`, seatConfig);
    return response.data;
  },

  getAvailableSeats: async (trainId) => {
    const response = await api.get(`/seats/train/${trainId}/available`);
    return response.data;
  },

  getAllSeatsForTrain: async (trainId) => {
    const response = await api.get(`/seats/train/${trainId}`);
    return response.data;
  },

  getSeatDetails: async (seatId) => {
    const response = await api.get(`/seats/${seatId}`);
    return response.data;
  },

  reserveSeat: async (seatId) => {
    const response = await api.post(`/seats/${seatId}/reserve`);
    return response.data;
  },

  releaseSeat: async (seatId) => {
    const response = await api.post(`/seats/${seatId}/release`);
    return response.data;
  },

  deleteSeat: async (seatId) => {
    try {
      const response = await api.delete(`/seats/${seatId}`);
      return response.data;
    } catch (error) {
      console.error('Error in deleteSeat:', error);
      throw error;
    }
  },

  updateSeatPrice: async (seatId, price) => {
    try {
      const response = await api.patch(`/seats/${seatId}`, { price });
      return response.data;
    } catch (error) {
      console.error('Error in updateSeatPrice:', error);
      throw error;
    }
  }
}; 