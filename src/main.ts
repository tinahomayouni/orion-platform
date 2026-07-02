
import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as dotenv from 'dotenv';
dotenv.config();


async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.TCP,
    },
  );
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,              // removes extra fields not in DTO
      forbidNonWhitelisted: true,   // throws error if extra fields exist
      transform: true,              // auto-transform payload to DTO class
    }),
  );
  await app.listen();
}
bootstrap();
