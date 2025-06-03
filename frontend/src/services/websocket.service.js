import { io } from 'socket.io-client';
import { Observable } from 'rxjs';

export class WebSocketService {
  constructor() {
    this.socket = null;
    this.notificationHandlers = new Map();
  }

  static getInstance() {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  async connect(url = 'http://localhost:3000', token) {
    if (!this.socket) {
      this.socket = io(`${url}/notifications`, {
        auth: { token },
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });
      
      this.socket.on('connect', () => {
        console.log('Connected to WebSocket server');
      });

      this.socket.on('disconnect', () => {
        console.log('Disconnected from WebSocket server');
      });

      this.socket.on('error', (error) => {
        console.error('WebSocket error:', error);
      });

      // Handle reconnection
      this.socket.on('reconnect_attempt', () => {
        // The token will be updated by the component when needed
        console.log('Attempting to reconnect...');
      });
    }
  }

  updateToken(token) {
    if (this.socket) {
      this.socket.auth = { token };
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  subscribeToReservations() {
    return new Observable((observer) => {
      if (!this.socket) {
        observer.error('Socket not connected');
        return;
      }

      const handler = (notification) => {
        observer.next(notification);
      };

      this.socket.on('reservation:created', handler);

      return () => {
        if (this.socket) {
          this.socket.off('reservation:created', handler);
        }
      };
    });
  }

  subscribeToSystemNotifications() {
    return new Observable((observer) => {
      if (!this.socket) {
        observer.error('Socket not connected');
        return;
      }

      const handler = (notification) => {
        observer.next(notification);
      };

      this.socket.on('system:notification', handler);

      return () => {
        if (this.socket) {
          this.socket.off('system:notification', handler);
        }
      };
    });
  }

  // Add a notification handler
  addNotificationHandler(type, handler) {
    if (!this.notificationHandlers.has(type)) {
      this.notificationHandlers.set(type, new Set());
    }
    this.notificationHandlers.get(type).add(handler);
  }

  // Remove a notification handler
  removeNotificationHandler(type, handler) {
    if (this.notificationHandlers.has(type)) {
      this.notificationHandlers.get(type).delete(handler);
    }
  }
} 