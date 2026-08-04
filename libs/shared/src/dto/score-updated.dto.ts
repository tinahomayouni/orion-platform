import { NewsSource, SourceImpact } from '../enums/news.enums';

export class ScoreUpdatedDto {
  id: string;
  fingerprint: string;
  source: NewsSource;
  title: string;
  summary?: string;
  url: string;
  sourceImpact: SourceImpact;
  score: number;
  scoreBreakdown: Record<string, unknown>;
  publishedAt: string;
}
