import { NestFactory } from '@nestjs/core';
import { ScoreUpdatedModule } from './score-updated.module';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(ScoreUpdatedModule, {
    logger: ['log', 'error', 'warn'],
  });
  app.enableShutdownHooks();
  console.log('score-updated consuming score.updated');
}
bootstrap();
