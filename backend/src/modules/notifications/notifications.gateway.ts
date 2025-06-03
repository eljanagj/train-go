import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UnauthorizedException, Inject, forwardRef } from '@nestjs/common';
import * as jwksRsa from 'jwks-rsa';
import * as jwt from 'jsonwebtoken';
import { NotificationsService } from './notifications.service';
import { NotificationType } from './entities/notification.entity';

interface ReservationNotification {
  type: string;
  data: {
    reservationId: string;
    passengerName: string;
    passengerSurname: string;
    scheduleId: number;
    status: string;
    price: number;
    userId?: string;
    role?: string;
  };
  timestamp: Date;
}

interface Auth0Payload extends jwt.JwtPayload {
  sub: string;
  role: string;
}

@WebSocketGateway({
  cors: {
    origin: '*', // In production, replace with your frontend URL
  },
  namespace: 'notifications',
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {
  @WebSocketServer() server: Server;
  private logger: Logger = new Logger('NotificationsGateway');
  private connectedClients: Map<string, { socket: Socket; userId: string; role: string }> = new Map();
  private jwksClient: jwksRsa.JwksClient;

  constructor(
    @Inject(forwardRef(() => NotificationsService))
    private notificationsService: NotificationsService
  ) {
    this.jwksClient = jwksRsa({
      cache: true,
      rateLimit: true,
      jwksRequestsPerMinute: 5,
      jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`,
    });
  }

  afterInit() {
    this.logger.log('Notifications Gateway initialized');
  }

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token;
      if (!token) {
        this.logger.warn('Connection attempt without token');
        client.disconnect();
        return;
      }

      let payload: Auth0Payload;
      try {
        const decodedToken = jwt.decode(token, { complete: true });
        if (!decodedToken) {
          throw new Error('Invalid token format');
        }

        const key = await this.jwksClient.getSigningKey(decodedToken.header.kid);
        const publicKey = key.getPublicKey();

        const verifyOptions: jwt.VerifyOptions = {
          algorithms: ['RS256'] as jwt.Algorithm[],
          audience: 'http://traingo.ks',
          issuer: `https://${process.env.AUTH0_DOMAIN}/`,
        };

        payload = jwt.verify(token, publicKey, verifyOptions) as Auth0Payload;
      } catch (error) {
        this.logger.error('Token verification failed:', error);
        client.disconnect();
        return;
      }

      // Extract role from custom claim
      const roles = (payload as any)['https://lab1.com/roles'] || [];
      const role = roles.includes('admin') ? 'admin' : 'user';
      const { sub: userId } = payload;

      // Remove any existing connection for this user
      for (const [clientId, info] of this.connectedClients.entries()) {
        if (info.userId === userId) {
          this.connectedClients.delete(clientId);
          const existingSocket = this.server.sockets.sockets.get(clientId);
          if (existingSocket) {
            existingSocket.disconnect();
          }
        }
      }

      // Store client information
      this.connectedClients.set(client.id, { socket: client, userId, role });

      // Join role-specific room
      client.join(`role:${role}`);
      // Join user-specific room
      client.join(`user:${userId}`);

      this.logger.log(`Client connected: ${client.id} (User: ${userId}, Role: ${role})`);

      try {
        // Send unread notifications count
        const unreadCount = role === 'admin' 
          ? await this.notificationsService.getAdminUnreadCount()
          : await this.notificationsService.getUnreadCount(userId);
        
        client.emit('unreadCount', unreadCount);

        // Send current notifications
        const notifications = role === 'admin'
          ? await this.notificationsService.getAdminNotifications()
          : await this.notificationsService.getUserNotifications(userId);
        
        client.emit('notifications', notifications);
      } catch (error) {
        this.logger.error(`Error sending initial data to client ${client.id}:`, error);
        // Don't disconnect the client, just log the error
      }
    } catch (error) {
      this.logger.error(`Connection error for client ${client.id}:`, error);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    try {
      const clientInfo = this.connectedClients.get(client.id);
      if (clientInfo) {
        this.logger.log(`Client disconnected: ${client.id} (User: ${clientInfo.userId}, Role: ${clientInfo.role})`);
        this.connectedClients.delete(client.id);
      }
    } catch (error) {
      this.logger.error(`Error handling disconnect for client ${client.id}:`, error);
    }
  }

  @SubscribeMessage('markAsRead')
  async handleMarkAsRead(client: Socket, notificationId: string) {
    const clientInfo = this.connectedClients.get(client.id);
    if (clientInfo) {
      const notification = await this.notificationsService.markAsRead(notificationId);
      if (notification) {
        client.emit('notificationRead', notification);
      }
    }
  }

  @SubscribeMessage('markAllAsRead')
  async handleMarkAllAsRead(client: Socket) {
    const clientInfo = this.connectedClients.get(client.id);
    if (!clientInfo) {
      throw new UnauthorizedException('Client not authenticated');
    }

    await this.notificationsService.markAllAsRead(clientInfo.userId, clientInfo.role);
    client.emit('allNotificationsRead');
  }

  @SubscribeMessage('getNotifications')
  async handleGetNotifications(client: Socket) {
    const clientInfo = this.connectedClients.get(client.id);
    if (clientInfo) {
      const notifications = clientInfo.role === 'admin'
        ? await this.notificationsService.getAdminNotifications()
        : await this.notificationsService.getUserNotifications(clientInfo.userId);
      
      client.emit('notifications', notifications);
    }
  }

  // Method to emit reservation notifications
  async emitReservationNotification(reservationData: any) {
    const notification = await this.notificationsService.createNotification({
      type: NotificationType.RESERVATION_CREATED,
      message: `New reservation created by ${reservationData.passengerName} ${reservationData.passengerSurname}`,
      data: reservationData,
      userId: reservationData.userId,
      role: 'admin'
    });

    // Emit to specific user
    if (reservationData.userId) {
      this.server.to(`user:${reservationData.userId}`).emit('reservation:created', notification);
    }

    // Emit to all admin users
    this.server.to('role:admin').emit('reservation:created', {
      ...notification,
      data: {
        ...reservationData,
        isAdminNotification: true,
      },
    });
  }

  // Method to emit system notifications to all users
  async emitSystemNotification(message: string, severity: 'info' | 'warning' | 'error' = 'info') {
    const notification = await this.notificationsService.createNotification({
      type: NotificationType.SYSTEM_NOTIFICATION,
      message,
      data: {
        severity,
        timestamp: new Date(),
      },
      role: 'user'
    });

    this.server.emit('system:notification', notification);
  }
} 