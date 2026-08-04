import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  NewsItemEntity,
  ProcessingStatus,
  QUEUES,
  RabbitmqService,
  ScoreUpdatedDto,
} from '@app/shared';

/**
 * Persists score updates, then forwards the same event so AI analyser runs
 * only after the DB row is scored (linear pipeline, no fanout races).
 */
@Injectable()
export class ScoreUpdatedService {
  private readonly logger = new Logger(ScoreUpdatedService.name);

  constructor(
    @InjectRepository(NewsItemEntity)
    private readonly repo: Repository<NewsItemEntity>,
    private readonly rabbitmq: RabbitmqService,
  ) {}

  async apply(payload: ScoreUpdatedDto): Promise<void> {
    await this.repo.update(
      { id: payload.id },
      {
        score: payload.score,
        scoreBreakdown: payload.scoreBreakdown as any,
        status: ProcessingStatus.SCORED,
        finalScore: payload.score,
      },
    );
    this.logger.log(`Score updated for ${payload.id}: ${payload.score}`);

    await this.rabbitmq.publish(QUEUES.NEWS_FOR_ANALYSIS, payload);
  }
}
