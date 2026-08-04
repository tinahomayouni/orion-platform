import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NewsItemEntity, RabbitmqModule } from '@app/shared';
import { NewsCollectedService } from './news-collected.service';
import { NewsConsumer } from './consumer/news.consumer';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST'),
        port: Number(config.get<string>('DB_PORT')),
        username: config.get<string>('DB_USERNAME'),
        password: config.get<string>('DB_PASSWORD'),
        database: config.get<string>('DB_NAME'),
        entities: [NewsItemEntity],
        synchronize: true,
      }),
    }),
    TypeOrmModule.forFeature([NewsItemEntity]),
    RabbitmqModule,
  ],
  providers: [NewsCollectedService, NewsConsumer],
})
export class NewsCollectedModule {}
