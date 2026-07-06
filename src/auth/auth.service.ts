import {
    ForbiddenException,
    Injectable,
    UnauthorizedException,
  } from '@nestjs/common';
  import { JwtService } from '@nestjs/jwt';
  import { ConfigService } from '@nestjs/config';
  import * as bcrypt from 'bcrypt';
  import { UserService } from '../user/user.service';
  import { RegisterDto } from '../auth/dto/register.dto';
  import { LoginDto } from '../auth/dto/login.dto';
  import { Role } from './enums/role.enum';
  import { User } from '../user/user.entity';
  
  
  export interface Tokens {
    accessToken: string;
    refreshToken: string;
  }
  
  @Injectable()
  export class AuthService {
    constructor(
      private readonly userService: UserService,
      private readonly jwtService: JwtService,
      private readonly configService: ConfigService,
    ) {}
  
    // Public self-registration is always forced to role = USER.
    // Only super-admin/agent (via UserController.create, behind RBAC)
    // can create accounts with elevated roles.
    async register(dto: RegisterDto): Promise<Omit<User, 'password'>> {
      const user = await this.userService.createUser({
        email: dto.email,
        password: dto.password,
        fullName: dto.fullName,
        role: Role.USER,
      });
      const { password, ...result } = user;
      return result;
    }
  
    async validateUser(email: string, plainPassword: string): Promise<User> {
      const user = await this.userService.findByEmail(email);
      if (!user || !user.isActive) {
        throw new UnauthorizedException('Invalid credentials');
      }
  
      const passwordMatches = await bcrypt.compare(plainPassword, user.password);
      if (!passwordMatches) {
        throw new UnauthorizedException('Invalid credentials');
      }
  
      return user;
    }
  
    async login(dto: LoginDto): Promise<Tokens> {
      const user = await this.validateUser(dto.email, dto.password);
      const tokens = await this.issueTokens(user);
      await this.persistRefreshToken(user.id, tokens.refreshToken);
      return tokens;
    }
  
    async refresh(userId: string, refreshToken: string): Promise<Tokens> {
      const user = await this.userService.findOne(userId);
      if (!user.hashedRefreshToken) {
        throw new ForbiddenException('Access denied');
      }
  
      const matches = await bcrypt.compare(
        refreshToken,
        user.hashedRefreshToken,
      );
      if (!matches) {
        throw new ForbiddenException('Access denied');
      }
  
      const tokens = await this.issueTokens(user);
      await this.persistRefreshToken(user.id, tokens.refreshToken);
      return tokens;
    }
  
    async logout(userId: string): Promise<void> {
      await this.userService.setHashedRefreshToken(userId, null);
    }
  
    private async issueTokens(user: User): Promise<Tokens> {
        const payload = {
          sub: user.id,
          email: user.email,
          role: user.role,
        };
      
        const accessSecret = this.configService.getOrThrow<string>(
          'JWT_ACCESS_SECRET',
        );
        const refreshSecret = this.configService.getOrThrow<string>(
          'JWT_REFRESH_SECRET',
        );
      
        const accessExpires = this.configService.getOrThrow<string>(
          'JWT_ACCESS_EXPIRES_IN',
        );
        const refreshExpires = this.configService.getOrThrow<string>(
          'JWT_REFRESH_EXPIRES_IN',
        );
      
        const [accessToken, refreshToken] = await Promise.all([
          this.jwtService.signAsync(payload, {
            secret: accessSecret,
            expiresIn: Number(accessExpires),
          }),
          this.jwtService.signAsync(payload, {
            secret: refreshSecret,
            expiresIn: Number(refreshExpires),
          }),
        ]);
      
        return {
          accessToken,
          refreshToken,
        };
      }
  
    private async persistRefreshToken(
      userId: string,
      refreshToken: string,
    ): Promise<void> {
      const hashed = await bcrypt.hash(refreshToken, 10);
      await this.userService.setHashedRefreshToken(userId, hashed);
    }
  }
  