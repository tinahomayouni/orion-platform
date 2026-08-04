import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  buildNewsFingerprint,
  NewsSource,
  RawNewsItemDto,
  SourceImpact,
} from '@app/shared';

type InvestorEvent = {
  id?: string | number;
  title: string;
  time?: string;
  date?: string;
  country?: string;
  impact?: string | number;
  actual?: string;
  forecast?: string;
  previous?: string;
  url?: string;
};

/**
 * Investing.com-style economic calendar provider.
 *
 * Default: optional JSON endpoint via INVESTOR_CALENDAR_URL.
 * If unset / unreachable, returns [] so the rest of the pipeline still runs
 * on ForexFactory data. Swap the fetch body when you have a stable source.
 */
@Injectable()
export class InvestorProvider {
  private readonly logger = new Logger(InvestorProvider.name);

  constructor(private readonly config: ConfigService) {}

  async fetch(): Promise<RawNewsItemDto[]> {
    const url = this.config.get<string>('INVESTOR_CALENDAR_URL');
    if (!url) {
      this.logger.debug(
        'INVESTOR_CALENDAR_URL not set — skipping investor scrape this run',
      );
      return [];
    }

    try {
      const res = await fetch(url, { headers: { Accept: 'application/json' } });
      if (!res.ok) {
        this.logger.warn(`Investor fetch failed: HTTP ${res.status}`);
        return [];
      }
      const events = (await res.json()) as InvestorEvent[];
      const collectedAt = new Date().toISOString();
      return events
        .filter((e) => e.title)
        .map((e) => this.toDto(e, collectedAt));
    } catch (err) {
      this.logger.error(`Investor fetch error: ${(err as Error).message}`);
      return [];
    }
  }

  private toDto(e: InvestorEvent, collectedAt: string): RawNewsItemDto {
    const publishedAt = new Date(e.time ?? e.date ?? Date.now()).toISOString();
    const externalId = String(e.id ?? `${e.country ?? ''}:${e.title}:${publishedAt}`);
    const itemUrl =
      e.url ?? `https://www.investing.com/economic-calendar/${externalId}`;

    return {
      fingerprint: buildNewsFingerprint({
        source: NewsSource.INVESTOR,
        externalId,
        url: itemUrl,
        title: e.title,
        publishedAt,
      }),
      source: NewsSource.INVESTOR,
      externalId,
      title: e.title,
      summary: [e.country, e.actual, e.forecast, e.previous]
        .filter(Boolean)
        .join(' | '),
      url: itemUrl,
      sourceImpact: this.mapImpact(e.impact),
      publishedAt,
      collectedAt,
      raw: e as unknown as Record<string, unknown>,
    };
  }

  private mapImpact(impact?: string | number): SourceImpact {
    if (impact === undefined || impact === null) return SourceImpact.UNKNOWN;
    const n = Number(impact);
    if (!Number.isNaN(n)) {
      if (n >= 3) return SourceImpact.HIGH;
      if (n === 2) return SourceImpact.MEDIUM;
      if (n === 1) return SourceImpact.LOW;
    }
    const s = String(impact).toLowerCase();
    if (s.includes('high') || s === '3') return SourceImpact.HIGH;
    if (s.includes('med') || s === '2') return SourceImpact.MEDIUM;
    if (s.includes('low') || s === '1') return SourceImpact.LOW;
    return SourceImpact.UNKNOWN;
  }
}
