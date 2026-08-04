import { NestFactory } from '@nestjs/core';
import { ScoreServiceModule } from './score-service.module';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(ScoreServiceModule, {
    logger: ['log', 'error', 'warn'],
  });
  app.enableShutdownHooks();
  console.log('score-service consuming news.collected');
}
bootstrap();
