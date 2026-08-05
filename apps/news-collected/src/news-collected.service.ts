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

  /**
   * Insert brand-new fingerprints; only rewrite an existing row when
   * actual/forecast/previous (or impact) changed — do NOT bump dates otherwise.
   */
  async saveAndPublish(item: RawNewsItemDto): Promise<void> {
    const existing = await this.repo.findOne({
      where: { fingerprint: item.fingerprint },
    });

    if (!existing) {
      const saved = await this.repo.save(
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
      await this.publishCollected(item, saved.id);
      this.logger.log(
        `Inserted ${saved.id.slice(0, 8)}… [${item.publishedAt.slice(0, 10)}] ${item.title}`,
      );
      return;
    }

    if (!this.contentChanged(existing, item)) {
      return;
    }

    // Keep publishedAt from the first insert — that is the event time, not "when we scraped".
    existing.summary = item.summary;
    existing.url = item.url;
    existing.sourceImpact = item.sourceImpact;
    existing.raw = item.raw;
    existing.collectedAt = new Date(item.collectedAt);
    existing.status = ProcessingStatus.COLLECTED;
    await this.repo.save(existing);

    await this.publishCollected(item, existing.id);
    this.logger.log(
      `Content updated ${existing.id.slice(0, 8)}… [${item.publishedAt.slice(0, 10)}] ${item.title}`,
    );
  }

  private contentChanged(
    existing: NewsItemEntity,
    item: RawNewsItemDto,
  ): boolean {
    if (existing.summary !== item.summary) return true;
    if (existing.sourceImpact !== item.sourceImpact) return true;

    const prev = (existing.raw ?? {}) as Record<string, unknown>;
    const next = item.raw ?? {};
    for (const key of ['actual', 'forecast', 'previous', 'impact'] as const) {
      if (String(prev[key] ?? '') !== String(next[key] ?? '')) return true;
    }
    return false;
  }

  private async publishCollected(item: RawNewsItemDto, id: string) {
    const payload: NewsCollectedDto = { ...item, id };
    await this.rabbitmq.publish(QUEUES.NEWS_COLLECTED, payload);
  }
}
