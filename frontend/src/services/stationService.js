import api from "./api";

export const stationService = {
  getAllStations: async () => {
    const response = await api.get("/stations");
    return response.data;
  },

  getActiveStations: async () => {
    const response = await api.get("/stations/active");
    return response.data;
  },

  searchStations: async (query) => {
    const response = await api.get(
      `/stations/search?q=${encodeURIComponent(query)}`
    );
    return response.data;
  },

  getStation: async (stationId) => {
    const response = await api.get(`/stations/${stationId}`);
    return response.data;
  },

  createStation: async (stationData) => {
    const response = await api.post("/stations", {
      name: stationData.name,
      location: stationData.location || undefined,
      facilities: stationData.facilities || undefined,
      contactInfo: stationData.contactInfo || undefined,
      operatingHours: stationData.operatingHours || undefined,
      status: stationData.status || "ACTIVE",
    });
    return response.data;
  },

  updateStation: async (stationID, stationData) => {
    const response = await api.patch(`/stations/${stationID}`, {
      name: stationData.name,
      location: stationData.location || undefined,
      facilities: stationData.facilities || undefined,
      contactInfo: stationData.contactInfo || undefined,
      operatingHours: stationData.operatingHours || undefined,
      status: stationData.status || "ACTIVE",
    });
    return response.data;
  },

  updateStationStatus: async (stationID, status) => {
    const response = await api.patch(`/stations/${stationID}/status`, {
      status,
    });
    return response.data;
  },

  deleteStation: async (stationID) => {
    await api.delete(`/stations/${stationID}`);
  },
};
