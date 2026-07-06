import { UseGuards } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { WsJwtAuthGuard } from './guards/ws-jwt-auth.guard';
import { JwtPayload } from '../auth/strategies/jwt.strategy';

// Example real-time gateway secured with the same JWT used for HTTP.
// Every incoming message goes through WsJwtAuthGuard, which verifies
// the token and attaches the decoded user to client.data.user.
@WebSocketGateway({ cors: { origin: '*' } })
export class EventsGateway {
  @WebSocketServer()
  server: Server;

  @UseGuards(WsJwtAuthGuard)
  @SubscribeMessage('ping')
  handlePing(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: unknown,
  ) {
    const user = client.data.user as JwtPayload;
    return {
      event: 'pong',
      data: { receivedFrom: user.email, role: user.role, echo: data },
    };
  }
}
