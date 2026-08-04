import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
  } from '@nestjs/common';
  import { JwtService } from '@nestjs/jwt';
  import { ConfigService } from '@nestjs/config';
  import { Socket } from 'socket.io';
  import { JwtPayload } from '../../auth/strategies/jwt.strategy';
  
  // Sockets don't carry an Authorization header the way HTTP requests do,
  // so the token is read from the handshake (auth payload or query string)
  // and verified manually, then attached to socket.data.user for later use
  // (e.g. by a WsRolesGuard, following the same pattern as RolesGuard).
  @Injectable()
  export class WsJwtAuthGuard implements CanActivate {
    constructor(
      private readonly jwtService: JwtService,
      private readonly configService: ConfigService,
    ) {}
  
    async canActivate(context: ExecutionContext): Promise<boolean> {
      const client: Socket = context.switchToWs().getClient();
      const token = this.extractToken(client);
  
      if (!token) {
        throw new UnauthorizedException('Missing token');
      }
  
      try {
        const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
          secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
        });
        client.data.user = payload;
        return true;
      } catch {
        throw new UnauthorizedException('Invalid or expired token');
      }
    }
  
    private extractToken(client: Socket): string | undefined {
      const authHeader = client.handshake.auth?.token as string | undefined;
      const queryToken = client.handshake.query?.token as string | undefined;
      return authHeader ?? queryToken;
    }
  }
  