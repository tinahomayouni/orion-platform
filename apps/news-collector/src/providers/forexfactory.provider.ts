import { Injectable, Logger } from '@nestjs/common';
import {
  buildNewsFingerprint,
  NewsSource,
  RawNewsItemDto,
  SourceImpact,
} from '@app/shared';

type FfEvent = {
  title?: string;
  country?: string;
  date?: string;
  impact?: string;
  forecast?: string;
  previous?: string;
  actual?: string;
  url?: string;
};

const IMPACT_MAP: Record<string, SourceImpact> = {
  High: SourceImpact.HIGH,
  Medium: SourceImpact.MEDIUM,
  Low: SourceImpact.LOW,
  Holiday: SourceImpact.LOW,
};

/**
 * ForexFactory this-week calendar via the public Faireconomy mirror.
 * Stable enough for collection; if the mirror is down we log and return [].
 */
@Injectable()
export class ForexFactoryProvider {
  private readonly logger = new Logger(ForexFactoryProvider.name);
  private readonly url =
    'https://nfs.faireconomy.media/ff_calendar_thisweek.json';

  async fetch(): Promise<RawNewsItemDto[]> {
    try {
      const res = await fetch(this.url, {
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) {
        this.logger.warn(`ForexFactory fetch failed: HTTP ${res.status}`);
        return [];
      }
      const events = (await res.json()) as FfEvent[];
      const collectedAt = new Date().toISOString();

      return events
        .filter((e) => e.title && e.date)
        .map((e) => this.toDto(e, collectedAt));
    } catch (err) {
      this.logger.error(
        `ForexFactory fetch error: ${(err as Error).message}`,
      );
      return [];
    }
  }

  private toDto(e: FfEvent, collectedAt: string): RawNewsItemDto {
    const publishedAt = new Date(e.date!).toISOString();
    const externalId = `${e.country ?? ''}:${e.title}:${e.date}`;
    const url =
      e.url ??
      `https://www.forexfactory.com/calendar?day=${publishedAt.slice(0, 10)}`;

    return {
      fingerprint: buildNewsFingerprint({
        source: NewsSource.FOREXFACTORY,
        externalId,
        url,
        title: e.title!,
        publishedAt,
      }),
      source: NewsSource.FOREXFACTORY,
      externalId,
      title: e.title!,
      summary: [e.country, e.actual, e.forecast, e.previous]
        .filter(Boolean)
        .join(' | '),
      url,
      sourceImpact: IMPACT_MAP[e.impact ?? ''] ?? SourceImpact.UNKNOWN,
      publishedAt,
      collectedAt,
      raw: e as Record<string, unknown>,
    };
  }
}
