import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { RabbitmqModule } from '@app/shared';
import { ForexFactoryProvider } from './providers/forexfactory.provider';
import { InvestorProvider } from './providers/investor.provider';
import { NewsCollectorService } from './collector.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    RabbitmqModule,
  ],
  providers: [ForexFactoryProvider, InvestorProvider, NewsCollectorService],
})
export class NewsCollectorModule implements OnModuleInit {
  constructor(private readonly collector: NewsCollectorService) {}

  async onModuleInit() {
    // Kick off one collection shortly after boot so queues aren't empty
    // while waiting for the first cron tick.
    setTimeout(() => {
      void this.collector.collect();
    }, 2000);
  }
}
