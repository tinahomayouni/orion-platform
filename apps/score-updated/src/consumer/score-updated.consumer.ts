import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import {
  CONSUMER_PREFETCH,
  QUEUES,
  RabbitmqService,
  ScoreUpdatedDto,
} from '@app/shared';
import { ScoreUpdatedService } from '../score-updated.service';

@Injectable()
export class ScoreUpdatedConsumer implements OnModuleInit {
  private readonly logger = new Logger(ScoreUpdatedConsumer.name);

  constructor(
    private readonly rabbitmq: RabbitmqService,
    private readonly scoreUpdated: ScoreUpdatedService,
  ) {}

  async onModuleInit() {
    await this.rabbitmq.consume(
      QUEUES.SCORE_UPDATED,
      CONSUMER_PREFETCH,
      (payload) => this.handle(payload),
    );
    this.logger.log(`Consuming ${QUEUES.SCORE_UPDATED}`);
  }

  private async handle(payload: ScoreUpdatedDto) {
    await this.scoreUpdated.apply(payload);
  }
}
