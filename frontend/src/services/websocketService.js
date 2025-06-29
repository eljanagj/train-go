import { io } from 'socket.io-client';
import { getAccessTokenSilently } from '@auth0/auth0-react';

let socket = null;

export const initializeWebSocket = async (getToken) => {
  if (socket) {
    return socket;
  }

  try {
    const token = await getToken();
    socket = io(process.env.REACT_APP_API_URL, {
      auth: { token },
      withCredentials: true
    });

    socket.on('connect', () => {
      console.log('WebSocket connected');
    });

    socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
    });

    socket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    return socket;
  } catch (error) {
    console.error('Failed to initialize WebSocket:', error);
    return null;
  }
};

export const getSocket = () => socket; 