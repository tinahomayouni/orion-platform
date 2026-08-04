import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// Protects any route with a valid access token (Authorization: Bearer <token>)
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
