import api from './api';

export const seatService = {
  getSeatDetails: async (trainId, date, time) => {
    try {
      const response = await api.get(`/seats/train/${trainId}`, {
        params: { date, time }
      });
      console.log('Seat details response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error in getSeatDetails:', error);
      throw error;
    }
  },

  createSeatsForTrain: async (trainId, seatConfig) => {
    const response = await api.post(`/seats/train/${trainId}`, seatConfig);
    return response.data;
  },

  deleteSeats: async (trainId, seatNumbers) => {
    const response = await api.delete(`/seats/train/${trainId}`, {
      data: { seatNumbers }
    });
    return response.data;
  },

  getAvailableSeats: async (trainId, date, time) => {
    try {
      const response = await api.get(`/seats/${trainId}/${date}/${time}/available`);
      console.log('Available seats response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error in getAvailableSeats:', error);
      throw error;
    }
  },

  reserveSeat: async (trainId, date, time, seatId, userId) => {
    try {
      const response = await api.post(
        `/seats/train/${trainId}/reserve/${date}/${time}/${seatId}`,
        { userId }
      );
      console.log('Reserve seat response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error in reserveSeat:', error);
      throw error;
    }
  },

  releaseSeat: async (trainId, date, time, seatId, userId) => {
    try {
      const response = await api.post(
        `/seats/train/${trainId}/release/${date}/${time}/${seatId}`,
        { userId }
      );
      console.log('Release seat response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error in releaseSeat:', error);
      throw error;
    }
  },

  getSeatConfig: async (trainId) => {
    try {
      const response = await api.get(`/seats/train/${trainId}`);
      console.log('Seat config response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error in getSeatConfig:', error);
      throw error;
    }
  },

  updateSeatPrice: async (trainId, seatNumber, price) => {
    try {
      const response = await api.patch(`/seats/train/${trainId}/${seatNumber}/price`, { price });
      console.log('Update seat price response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error in updateSeatPrice:', error);
      throw error;
    }
  }
}; 