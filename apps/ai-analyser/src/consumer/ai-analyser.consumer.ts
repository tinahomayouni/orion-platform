import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import {
  CONSUMER_PREFETCH,
  QUEUES,
  RabbitmqService,
  ScoreUpdatedDto,
} from '@app/shared';
import { AiAnalyserService } from '../ai-analyser.service';

@Injectable()
export class AiAnalyserConsumer implements OnModuleInit {
  private readonly logger = new Logger(AiAnalyserConsumer.name);

  constructor(
    private readonly rabbitmq: RabbitmqService,
    private readonly analyser: AiAnalyserService,
  ) {}

  async onModuleInit() {
    await this.rabbitmq.consume(
      QUEUES.NEWS_FOR_ANALYSIS,
      CONSUMER_PREFETCH,
      (payload) => this.handle(payload),
    );
    this.logger.log(`Consuming ${QUEUES.NEWS_FOR_ANALYSIS}`);
  }

  private async handle(payload: ScoreUpdatedDto) {
    await this.analyser.analyseAndPublish(payload);
  }
}
