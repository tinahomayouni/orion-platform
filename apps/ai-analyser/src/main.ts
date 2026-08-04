import { NestFactory } from '@nestjs/core';
import { AiAnalyserModule } from './ai-analyser.module';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AiAnalyserModule, {
    logger: ['log', 'error', 'warn'],
  });
  app.enableShutdownHooks();
  console.log('ai-analyser consuming score.updated.analyse');
}
bootstrap();
