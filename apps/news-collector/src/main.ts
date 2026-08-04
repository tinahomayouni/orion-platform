import { NestFactory } from '@nestjs/core';
import { NewsCollectorModule } from './news-collector.module';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(NewsCollectorModule, {
    logger: ['log', 'error', 'warn'],
  });
  app.enableShutdownHooks();
  console.log('news-collector running (cron every 5 min)');
}
bootstrap();
