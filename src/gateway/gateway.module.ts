import { Module } from '@nestjs/common';
import { EventsGateway } from './event.gateway';
import { AuthModule } from '../auth/auth.module'; // provides JwtModule

@Module({
  imports: [AuthModule],
  providers: [EventsGateway],
})
export class GatewayModule {}
