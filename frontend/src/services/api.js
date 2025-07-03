import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});


let cachedToken = null;
let tokenExpiry = null;
let tokenGetter = null;
let refreshPromise = null;


export const setTokenGetter = (getTokenFunction) => {
  tokenGetter = getTokenFunction;
};


export const clearTokenCache = () => {
  cachedToken = null;
  tokenExpiry = null;
  refreshPromise = null;
};

// Check if token is expired (with 5-minute buffer)
const isTokenExpired = () => {
  if (!tokenExpiry) return true;
  const bufferTime = 5 * 60 * 1000; // 5 minutes buffer
  return Date.now() >= (tokenExpiry - bufferTime);
};

// Get token with caching
const getValidToken = async () => {

  if (cachedToken && !isTokenExpired()) {
    return cachedToken;
  }


  if (refreshPromise) {
    return refreshPromise;
  }


  refreshPromise = refreshToken();
  try {
    const token = await refreshPromise;
    return token;
  } finally {
    refreshPromise = null;
  }
};


const refreshToken = async () => {
  if (!tokenGetter) {
    throw new Error('Token getter not set');
  }

  try {
    const token = await tokenGetter();
    
    if (token) {
      cachedToken = token;
      tokenExpiry = Date.now() + (55 * 60 * 1000);
    }
    
    return token;
  } catch (error) {
    cachedToken = null;
    tokenExpiry = null;
    throw error;
  }
};

// Request interceptor to add authentication token
api.interceptors.request.use(
  async (config) => {
    if (tokenGetter) {
      try {
        const token = await getValidToken();
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
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Clear cache and force refresh
        cachedToken = null;
        tokenExpiry = null;
        
        const newToken = await getValidToken();
        if (newToken) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
      }
    }
    
    if (error.response?.status === 401) {
      console.error('Authentication failed. Token may be invalid or expired.');
    }
    return Promise.reject(error);
  }
);

export default api; 