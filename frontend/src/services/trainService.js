import api from './api';

export const trainService = {
  getAllTrains: async () => {
    const response = await api.get('/trains');
    return response.data;
  },

  createTrain: async (trainData) => {
    const response = await api.post('/trains', trainData);
    return response.data;
  },

  updateTrain: async (trainID, trainData) => {
    const response = await api.patch(`/trains/${trainID}`, trainData);
    return response.data;
  },

  updateTrainStatus: async (trainID, status) => {
    const response = await api.patch(`/trains/${trainID}/status`, { status });
    return response.data;
  },

  deleteTrain: async (trainID) => {
    await api.delete(`/trains/${trainID}`);
  }
}; 