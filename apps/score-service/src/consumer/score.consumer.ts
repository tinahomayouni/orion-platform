import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import {
  CONSUMER_PREFETCH,
  NewsCollectedDto,
  QUEUES,
  RabbitmqService,
  ScoreUpdatedDto,
} from '@app/shared';
import { NewsScoringService } from '../scoring/news-scoring.service';

@Injectable()
export class ScoreConsumer implements OnModuleInit {
  private readonly logger = new Logger(ScoreConsumer.name);

  constructor(
    private readonly rabbitmq: RabbitmqService,
    private readonly scoring: NewsScoringService,
  ) {}

  async onModuleInit() {
    await this.rabbitmq.consume(
      QUEUES.NEWS_COLLECTED,
      CONSUMER_PREFETCH,
      (payload) => this.handle(payload),
    );
    this.logger.log(`Consuming ${QUEUES.NEWS_COLLECTED}`);
  }

  private async handle(item: NewsCollectedDto) {
    const { score, breakdown } = this.scoring.score(item);

    const payload: ScoreUpdatedDto = {
      id: item.id,
      fingerprint: item.fingerprint,
      source: item.source,
      title: item.title,
      summary: item.summary,
      url: item.url,
      sourceImpact: item.sourceImpact,
      score,
      scoreBreakdown: breakdown,
      publishedAt: item.publishedAt,
    };

    await this.rabbitmq.publish(QUEUES.SCORE_UPDATED, payload);
    this.logger.debug(`Scored ${item.id} → ${score}`);
  }
}
