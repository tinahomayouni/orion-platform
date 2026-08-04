import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  NewsCollectedDto,
  NewsItemEntity,
  ProcessingStatus,
  QUEUES,
  RabbitmqService,
  RawNewsItemDto,
} from '@app/shared';

@Injectable()
export class NewsCollectedService {
  private readonly logger = new Logger(NewsCollectedService.name);

  constructor(
    @InjectRepository(NewsItemEntity)
    private readonly repo: Repository<NewsItemEntity>,
    private readonly rabbitmq: RabbitmqService,
  ) {}

  async saveAndPublish(item: RawNewsItemDto): Promise<void> {
    const exists = await this.repo.exists({
      where: { fingerprint: item.fingerprint },
    });
    if (exists) {
      this.logger.debug(`Duplicate skipped: ${item.fingerprint.slice(0, 12)}…`);
      return;
    }

    let saved: NewsItemEntity;
    try {
      saved = await this.repo.save(
        this.repo.create({
          fingerprint: item.fingerprint,
          source: item.source,
          externalId: item.externalId,
          title: item.title,
          summary: item.summary,
          url: item.url,
          sourceImpact: item.sourceImpact,
          publishedAt: new Date(item.publishedAt),
          collectedAt: new Date(item.collectedAt),
          raw: item.raw,
          status: ProcessingStatus.COLLECTED,
        }),
      );
    } catch {
      // Unique race between exists-check and insert
      this.logger.debug(`Duplicate race skipped: ${item.fingerprint.slice(0, 12)}…`);
      return;
    }

    const payload: NewsCollectedDto = { ...item, id: saved.id };
    await this.rabbitmq.publish(QUEUES.NEWS_COLLECTED, payload);
  }
}
