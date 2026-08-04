import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RabbitmqModule } from '@app/shared';
import { NewsScoringService } from './scoring/news-scoring.service';
import { ScoreConsumer } from './consumer/score.consumer';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), RabbitmqModule],
  providers: [NewsScoringService, ScoreConsumer],
})
export class ScoreServiceModule {}
