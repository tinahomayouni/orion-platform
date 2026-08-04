import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NewsItemEntity } from '@app/shared';
import { ChartGroupBy, ChartQueryDto } from './dto/chart-query.dto';
import { QueryNewsDto } from './dto/query-news.dto';
import { UpdateNewsDto } from './dto/update-news.dto';

@Injectable()
export class NewsService {
  constructor(
    @InjectRepository(NewsItemEntity)
    private readonly repo: Repository<NewsItemEntity>,
  ) {}

  async findAll(query: QueryNewsDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const qb = this.repo
      .createQueryBuilder('n')
      .orderBy('n.publishedAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (query.asset) {
      qb.andWhere(`n.assets @> :assetJson`, {
        assetJson: JSON.stringify([query.asset]),
      });
    }

    if (query.sentiment) {
      qb.andWhere('n.sentiment = :sentiment', {
        sentiment: query.sentiment,
      });
    }

    if (query.source) {
      qb.andWhere('n.source = :source', { source: query.source });
    }

    if (query.q?.trim()) {
      qb.andWhere('n.title ILIKE :q', { q: `%${query.q.trim()}%` });
    }

    const [items, total] = await qb.getManyAndCount();

    return {
      items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async findOne(id: string): Promise<NewsItemEntity> {
    const item = await this.repo.findOne({ where: { id } });
    if (!item) throw new NotFoundException(`News ${id} not found`);
    return item;
  }

  async update(id: string, dto: UpdateNewsDto): Promise<NewsItemEntity> {
    const item = await this.findOne(id);
    Object.assign(item, dto);
    return this.repo.save(item);
  }

  async remove(id: string): Promise<void> {
    const result = await this.repo.delete(id);
    if (!result.affected) throw new NotFoundException(`News ${id} not found`);
  }

  /**
   * Simple chart series: count + avg finalScore per bucket,
   * plus sentiment breakdown for the same window.
   */
  async chart(query: ChartQueryDto) {
    const to = query.to ? new Date(query.to) : new Date();
    const from = query.from
      ? new Date(query.from)
      : new Date(to.getTime() - (query.days ?? 7) * 86_400_000);

    const groupBy = query.groupBy ?? ChartGroupBy.DAY;
    const trunc = groupBy === ChartGroupBy.HOUR ? 'hour' : 'day';

    const seriesQb = this.repo
      .createQueryBuilder('n')
      .select(`date_trunc('${trunc}', n."publishedAt")`, 'bucket')
      .addSelect('COUNT(*)::int', 'count')
      .addSelect('COALESCE(ROUND(AVG(n."finalScore"))::int, 0)', 'avgFinalScore')
      .addSelect('COALESCE(ROUND(AVG(n.score))::int, 0)', 'avgScore')
      .where('n."publishedAt" BETWEEN :from AND :to', { from, to })
      .groupBy('bucket')
      .orderBy('bucket', 'ASC');

    if (query.asset) {
      seriesQb.andWhere(`n.assets @> :assetJson`, {
        assetJson: JSON.stringify([query.asset]),
      });
    }

    const seriesRaw = await seriesQb.getRawMany<{
      bucket: Date;
      count: number;
      avgFinalScore: number;
      avgScore: number;
    }>();

    const sentimentQb = this.repo
      .createQueryBuilder('n')
      .select(`COALESCE(n.sentiment, 'unknown')`, 'sentiment')
      .addSelect('COUNT(*)::int', 'count')
      .where('n."publishedAt" BETWEEN :from AND :to', { from, to })
      .groupBy('sentiment');

    if (query.asset) {
      sentimentQb.andWhere(`n.assets @> :assetJson`, {
        assetJson: JSON.stringify([query.asset]),
      });
    }

    const sentimentRaw = await sentimentQb.getRawMany<{
      sentiment: string;
      count: number;
    }>();

    return {
      from: from.toISOString(),
      to: to.toISOString(),
      groupBy,
      asset: query.asset ?? null,
      series: seriesRaw.map((r) => ({
        bucket: new Date(r.bucket).toISOString(),
        count: Number(r.count),
        avgFinalScore: Number(r.avgFinalScore),
        avgScore: Number(r.avgScore),
      })),
      sentimentBreakdown: sentimentRaw.map((r) => ({
        sentiment: r.sentiment,
        count: Number(r.count),
      })),
    };
  }
}
