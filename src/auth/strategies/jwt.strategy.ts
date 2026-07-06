import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Role } from '../enums/role.enum';

export interface JwtPayload {
  sub: string; // user id
  email: string;
  role: Role;
  accessToken: string;
  hashedRefreshToken: string | null;
  tokenType: 'access' | 'refresh';
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_ACCESS_SECRET') || '',
    });
  }

  // Whatever is returned here becomes `request.user`
  async validate(payload: JwtPayload): Promise<JwtPayload> {
    return { sub: payload.sub, email: payload.email, role: payload.role, accessToken: payload.accessToken, hashedRefreshToken: payload.hashedRefreshToken, tokenType: payload.tokenType };
  }
}
