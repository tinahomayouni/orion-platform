import {
    Body,
    Controller,
    Post,
    UnauthorizedException,
    UseGuards,
  } from '@nestjs/common';
  import { JwtService } from '@nestjs/jwt';
  import { ConfigService } from '@nestjs/config';
  import { AuthService } from './auth.service';
  import { RegisterDto } from '../auth/dto/register.dto';
  import { LoginDto } from '../auth/dto/login.dto';
  import { RefreshTokenDto } from '../auth/dto/refresh-token.dto';
  import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
  import { CurrentUser } from '../auth/decorators/current-user.decorator';
  import type { JwtPayload } from '../auth/strategies/jwt.strategy';
    
  @Controller('auth')
  export class AuthController {
    constructor(
      private readonly authService: AuthService,
      private readonly jwtService: JwtService,
      private readonly configService: ConfigService,
    ) {}
  
    // Public self sign-up. Always created with role = USER.
    @Post('register')
    register(@Body() dto: RegisterDto) {
      return this.authService.register(dto);
    }
  
    @Post('login')
    login(@Body() dto: LoginDto) {
      return this.authService.login(dto);
    }
  
    // Refresh token is sent in the body (not as a bearer access token),
    // so we verify it manually against the refresh secret here.
    @Post('refresh')
    async refresh(@Body() dto: RefreshTokenDto) {
      try {
        const payload = await this.jwtService.verifyAsync<JwtPayload>(
          dto.refreshToken,
          { secret: this.configService.get<string>('JWT_REFRESH_SECRET') },
        );
        return this.authService.refresh(payload.sub, dto.refreshToken);
      } catch {
        throw new UnauthorizedException('Invalid or expired refresh token');
      }
    }
  
    @UseGuards(JwtAuthGuard)
    @Post('logout')
    logout(@CurrentUser() user: JwtPayload) {
      return this.authService.logout(user.sub);
    }
  }
  