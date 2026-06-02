import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtStrategy } from '../authz/jwt.strategy';

interface AuthenticatedUser {
  sub: string;
  email: string;
  name: string;
  roles: string[];
}

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL,
    credentials: true,
  },
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private userSockets: Map<string, Socket> = new Map();

  constructor(private jwtStrategy: JwtStrategy) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token;
      if (!token) {
        client.disconnect();
        return;
      }

      // Use the existing JWT strategy to validate the token
      const payload = await this.jwtStrategy.validate(token);
      const user = payload as AuthenticatedUser;

      // Join only the appropriate room based on role
      if (user.roles.includes('admin')) {
        client.join('admin');
      } else {
        client.join(user.sub); // Only join personal room for non-admin users
      }

      this.userSockets.set(user.sub, client);
    } catch (error) {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    for (const [userId, socket] of this.userSockets.entries()) {
      if (socket === client) {
        this.userSockets.delete(userId);
        break;
      }
    }
  }
}
