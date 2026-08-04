import { NestFactory } from '@nestjs/core';
import { NewsCollectedModule } from './news-collected.module';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(NewsCollectedModule, {
    logger: ['log', 'error', 'warn'],
  });
  app.enableShutdownHooks();
  console.log('news-collected consuming raw.* queues');
}
bootstrap();
