import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Transport } from '@nestjs/microservices';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { existsSync } from 'fs';
import { join } from 'path';
import { AppModule } from './app.module';

function resolveViewsDir(): string {
  const candidates = [
    join(process.cwd(), 'dist/apps/api/views'),
    join(process.cwd(), 'apps/api/src/views'),
    join(__dirname, 'views'),
    join(__dirname, '..', '..', 'views'),
  ];
  return (
    candidates.find((dir) =>
      existsSync(join(dir, 'news-dashboard.ejs')),
    ) ?? join(process.cwd(), 'apps/api/src/views')
  );
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.setBaseViewsDir(resolveViewsDir());
  app.setViewEngine('ejs');

  app.enableCors({
    origin: true,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  app.connectMicroservice({
    transport: Transport.TCP,
    options: {
      host: '127.0.0.1',
      port: 8877,
    },
  });

  const config = new DocumentBuilder()
    .setTitle('Orion API')
    .setDescription('Auth + News analytics')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.startAllMicroservices();
  await app.listen(3000);

  console.log('HTTP: http://localhost:3000');
  console.log('Dashboard: http://localhost:3000/');
  console.log('Swagger: http://localhost:3000/api');
}
bootstrap();
