import api from './api';

export const trainService = {
  getAllTrains: async () => {
    const response = await api.get('/trains');
    return response.data;
  },

  getTrain: async (trainId) => {
    const response = await api.get(`/trains/${trainId}`);
    return response.data;
  },

  createTrain: async (trainData) => {
    const response = await api.post('/trains', {
      trainName: trainData.trainName,
      model: trainData.model,
      manufacturer: trainData.manufacturer || undefined,
      productionYear: trainData.productionYear ? parseInt(trainData.productionYear) : undefined,
      totalCapacity: 0 // Backend will handle this
    });
    return response.data;
  },

  updateTrain: async (trainID, trainData) => {
    const response = await api.patch(`/trains/${trainID}`, {
      trainName: trainData.trainName,
      model: trainData.model,
      manufacturer: trainData.manufacturer || undefined,
      productionYear: trainData.productionYear ? parseInt(trainData.productionYear) : undefined
    });
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