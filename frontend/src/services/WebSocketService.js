import { io } from 'socket.io-client';
import { getAccessToken, setAccessToken, removeAccessToken } from './auth';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
    this.isConnecting = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000; // Start with 1 second delay
  }

  connect() {
    if (this.socket?.connected || this.isConnecting) {
      return;
    }

    this.isConnecting = true;
    const token = getAccessToken();

    if (!token) {
      console.error('No access token available');
      this.isConnecting = false;
      return;
    }

    this.socket = io(`${import.meta.env.VITE_API_URL}/notifications`, {
      auth: { token },
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.isConnecting = false;
      this.reconnectAttempts = 0;
      this.reconnectDelay = 1000;
      this.emit('connectionStatus', true);
    });

    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      this.emit('connectionStatus', false);
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.isConnecting = false;
      this.reconnectAttempts++;
      this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30000); // Max 30 seconds delay
      this.emit('connectionStatus', false);

      // If the error is due to an invalid token, remove it
      if (error.message.includes('jwt') || error.message.includes('token')) {
        removeAccessToken();
      }
    });

    // Set up notification event listeners
    this.socket.on('reservation:created', (notification) => {
      this.emit('notification', notification);
    });

    this.socket.on('system:notification', (notification) => {
      this.emit('notification', notification);
    });

    this.socket.on('unreadCount', (count) => {
      this.emit('unreadCount', count);
    });

    this.socket.on('notifications', (notifications) => {
      this.emit('notifications', notifications);
    });

    this.socket.on('notificationRead', (notification) => {
      this.emit('notificationRead', notification);
    });

    this.socket.on('allNotificationsRead', () => {
      this.emit('allNotificationsRead');
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => callback(data));
    }
  }

  // New methods for notification management
  markAsRead(notificationId) {
    if (this.socket?.connected) {
      this.socket.emit('markAsRead', notificationId);
    }
  }

  markAllAsRead() {
    if (this.socket?.connected) {
      this.socket.emit('markAllAsRead');
    }
  }

  getNotifications() {
    if (this.socket?.connected) {
      this.socket.emit('getNotifications');
    }
  }
}

export const webSocketService = new WebSocketService(); 