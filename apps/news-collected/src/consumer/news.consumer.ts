import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import {
  CONSUMER_PREFETCH,
  QUEUES,
  RabbitmqService,
  RawNewsItemDto,
} from '@app/shared';
import { NewsCollectedService } from '../news-collected.service';

@Injectable()
export class NewsConsumer implements OnModuleInit {
  private readonly logger = new Logger(NewsConsumer.name);

  constructor(
    private readonly rabbitmq: RabbitmqService,
    private readonly newsCollected: NewsCollectedService,
  ) {}

  async onModuleInit() {
    await this.rabbitmq.consume(
      QUEUES.RAW_FOREXFACTORY,
      CONSUMER_PREFETCH,
      (payload) => this.handle(payload),
    );
    await this.rabbitmq.consume(
      QUEUES.RAW_INVESTOR,
      CONSUMER_PREFETCH,
      (payload) => this.handle(payload),
    );
    this.logger.log(
      `Consuming ${QUEUES.RAW_FOREXFACTORY} and ${QUEUES.RAW_INVESTOR}`,
    );
  }

  private async handle(payload: RawNewsItemDto) {
    await this.newsCollected.saveAndPublish(payload);
  }
}
