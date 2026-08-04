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

  /** Also exposed for a one-shot run at boot / manual trigger. */
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

      for (const item of ff) {
        await this.rabbitmq.publish(QUEUES.RAW_FOREXFACTORY, item);
      }
      for (const item of inv) {
        await this.rabbitmq.publish(QUEUES.RAW_INVESTOR, item);
      }

      this.logger.log(
        `Published ${ff.length} ForexFactory + ${inv.length} Investor items`,
      );
    } finally {
      this.running = false;
    }
  }
}
