import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { QUEUES, RabbitmqService } from '@app/shared';
import { ForexFactoryProvider } from './providers/forexfactory.provider';
import { InvestorProvider } from './providers/investor.provider';

@Injectable()
export class NewsCollectorService {
  private readonly logger = new Logger(NewsCollectorService.name);
  private running = false;

  constructor(
    private readonly forexFactory: ForexFactoryProvider,
    private readonly investor: InvestorProvider,
    private readonly rabbitmq: RabbitmqService,
  ) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async collectOnSchedule() {
    await this.collect();
  }

  async collect() {
    if (this.running) {
      this.logger.warn('Collection already in progress — skipping');
      return;
    }
    this.running = true;
    try {
      const [ff, inv] = await Promise.all([
        this.forexFactory.fetch(),
        this.investor.fetch(),
      ]);

      // Only publish NEW / CHANGED items — re-sending the same 99 does nothing useful.
      for (const item of ff.delta) {
        await this.rabbitmq.publish(QUEUES.RAW_FOREXFACTORY, item);
      }
      for (const item of inv) {
        await this.rabbitmq.publish(QUEUES.RAW_INVESTOR, item);
      }

      this.logger.log(
        `Collect done source=${ff.source} ffTotal=${ff.items.length} ` +
          `ffPublishedDelta=${ff.delta.length} investor=${inv.length}`,
      );

      if (ff.source !== 'live' && ff.delta.length === 0) {
        this.logger.warn(
          'No live FF data and no unseen cache items — DB row count will stay the same until the calendar API allows a live fetch (HTTP 429 cooldown).',
        );
      }
    } finally {
      this.running = false;
    }
  }
}
