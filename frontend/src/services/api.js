import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Variable to store the token getter function
let tokenGetter = null;

// Function to set the token getter (to be called from App.jsx)
export const setTokenGetter = (getTokenFunction) => {
  tokenGetter = getTokenFunction;
};

// Request interceptor to add authentication token
api.interceptors.request.use(
  async (config) => {
    if (tokenGetter) {
      try {
        const token = await tokenGetter();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (error) {
        console.warn('Could not retrieve access token:', error);
        // Continue with request - some endpoints might be public
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error('Authentication failed. Token may be invalid or expired.');
    }
    return Promise.reject(error);
  }
);

export default api; 