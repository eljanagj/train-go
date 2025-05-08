import api from './api';

export const scheduleService = {
  getAllSchedules: async () => {
    const response = await api.get('/schedules');
    return response.data;
  },

  createSchedule: async (scheduleData) => {
    const response = await api.post('/schedules', scheduleData);
    return response.data;
  },

  updateSchedule: async (scheduleId, scheduleData) => {
    const response = await api.put(`/schedules/${scheduleId}`, scheduleData);
    return response.data;
  },

  deleteSchedule: async (scheduleId) => {
    await api.delete(`/schedules/${scheduleId}`);
  }
}; 