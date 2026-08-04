import { NewsSource, SourceImpact } from '../enums/news.enums';

export class RawNewsItemDto {
  fingerprint: string;
  source: NewsSource;
  externalId?: string;
  title: string;
  summary?: string;
  url: string;
  sourceImpact: SourceImpact;
  publishedAt: string; // ISO
  collectedAt: string; // ISO
  raw: Record<string, unknown>;
}
