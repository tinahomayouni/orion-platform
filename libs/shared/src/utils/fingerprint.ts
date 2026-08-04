import { createHash } from 'crypto';
import { NewsSource } from '../enums/news.enums';

export function buildNewsFingerprint(input: {
  source: NewsSource;
  externalId?: string;
  url: string;
  title: string;
  publishedAt: string;
}): string {
  const key = [
    input.source,
    input.externalId ?? '',
    input.url,
    input.title,
    input.publishedAt,
  ].join('|');
  return createHash('sha256').update(key).digest('hex');
}
