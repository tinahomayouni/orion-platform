import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  NewsAnalyzedDto,
  NewsItemEntity,
  ProcessingStatus,
  QUEUES,
  RabbitmqService,
  ScoreUpdatedDto,
} from '@app/shared';
import { AiAnalysisService } from './analysis/ai-analysis.service';

@Injectable()
export class AiAnalyserService {
  private readonly logger = new Logger(AiAnalyserService.name);

  constructor(
    private readonly analysis: AiAnalysisService,
    @InjectRepository(NewsItemEntity)
    private readonly repo: Repository<NewsItemEntity>,
    private readonly rabbitmq: RabbitmqService,
  ) {}

  async analyseAndPublish(item: ScoreUpdatedDto): Promise<void> {
    const result = this.analysis.analyze(item);

    await this.repo.update(
      { id: item.id },
      {
        assets: result.assets as any,
        relevant: result.relevant,
        sentiment: result.sentiment,
        analysisSummary: result.analysisSummary,
        finalScore: result.finalScore,
        status: ProcessingStatus.ANALYZED,
      },
    );

    const payload: NewsAnalyzedDto = { ...item, ...result };
    await this.rabbitmq.publish(QUEUES.NEWS_ANALYZED, payload);
    this.logger.log(
      `Analyzed ${item.id}: relevant=${result.relevant} assets=[${result.assets.join(',')}] ${result.sentiment} final=${result.finalScore}`,
    );
  }
}
