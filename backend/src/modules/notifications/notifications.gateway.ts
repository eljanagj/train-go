import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtStrategy } from '../authz/jwt.strategy';
import { AUTH_DISABLED } from '../../config/auth.config';

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
    if (AUTH_DISABLED) {
      const userId = (client.handshake.auth?.userId as string) || 'local-dev';
      client.join(userId);
      client.join('admin');
      this.userSockets.set(userId, client);
      return;
    }

    try {
      const token = client.handshake.auth.token;
      if (!token) {
        client.disconnect();
        return;
      }

      const payload = await this.jwtStrategy.validate(token);
      const user = payload as { sub: string; roles: string[] };

      if (user.roles.includes('Admin') || user.roles.includes('admin')) {
        client.join('admin');
      } else {
        client.join(user.sub);
      }

      this.userSockets.set(user.sub, client);
    } catch {
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
