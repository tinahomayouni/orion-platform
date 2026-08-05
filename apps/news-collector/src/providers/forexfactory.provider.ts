import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
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

export type ForexFetchResult = {
  items: RawNewsItemDto[];
  /** Only items not seen before (or whose actual/forecast changed). */
  delta: RawNewsItemDto[];
  source: 'live' | 'cache' | 'empty';
};

const IMPACT_MAP: Record<string, SourceImpact> = {
  High: SourceImpact.HIGH,
  Medium: SourceImpact.MEDIUM,
  Low: SourceImpact.LOW,
  Holiday: SourceImpact.LOW,
};

const DEFAULT_URLS = [
  'https://nfs.faireconomy.media/ff_calendar_thisweek.json',
];

/** After a 429, wait this long before hitting the live API again. */
const RATE_LIMIT_COOLDOWN_MS = 20 * 60_000;

/**
 * ForexFactory calendar via Faireconomy mirror.
 * - Live fetch when not rate-limited
 * - On 429: cooldown + do not re-publish the same cache as "new"
 * - Only returns `delta` items that are new or content-changed vs last successful snapshot
 */
@Injectable()
export class ForexFactoryProvider {
  private readonly logger = new Logger(ForexFactoryProvider.name);
  private readonly cachePath = join(
    process.cwd(),
    '.cache',
    'ff_calendar_thisweek.json',
  );
  private readonly seenPath = join(process.cwd(), '.cache', 'ff_seen.json');
  private memoryCache: FfEvent[] | null = null;
  /** fingerprint → content hash of actual|forecast|previous|impact */
  private seen = new Map<string, string>();
  private rateLimitedUntil = 0;

  constructor(private readonly config: ConfigService) {
    this.loadSeen();
    this.seedSeenFromCacheIfEmpty();
  }

  async fetch(): Promise<ForexFetchResult> {
    const { events, source } = await this.loadEvents();
    if (!events.length) {
      return { items: [], delta: [], source: 'empty' };
    }

    const collectedAt = new Date().toISOString();
    const items = events
      .filter((e) => e.title && e.date)
      .map((e) => this.toDto(e, collectedAt));

    const delta: RawNewsItemDto[] = [];
    for (const item of items) {
      const hash = this.contentHash(item);
      const prev = this.seen.get(item.fingerprint);
      if (prev !== hash) {
        delta.push(item);
        this.seen.set(item.fingerprint, hash);
      }
    }
    this.saveSeen();

    this.logger.log(
      `FF ${source}: total=${items.length} delta(new/changed)=${delta.length}` +
        (source === 'cache' ? ' (live blocked — only unpublished deltas from cache)' : ''),
    );

    return { items, delta, source };
  }

  private contentHash(item: RawNewsItemDto): string {
    const raw = item.raw ?? {};
    const key = [
      raw.actual ?? '',
      raw.forecast ?? '',
      raw.previous ?? '',
      raw.impact ?? '',
      item.summary ?? '',
    ].join('|');
    return createHash('sha1').update(key).digest('hex');
  }

  private async loadEvents(): Promise<{
    events: FfEvent[];
    source: 'live' | 'cache';
  }> {
    const now = Date.now();
    if (now < this.rateLimitedUntil) {
      const mins = Math.ceil((this.rateLimitedUntil - now) / 60_000);
      this.logger.warn(
        `FF live cooldown active (~${mins}m left) — not calling API`,
      );
      return { events: this.readCache(), source: 'cache' };
    }

    const urls = this.resolveUrls();
    for (const url of urls) {
      const live = await this.tryFetchUrl(url);
      if (live) {
        this.writeCache(live);
        return { events: live, source: 'live' };
      }
    }

    return { events: this.readCache(), source: 'cache' };
  }

  private resolveUrls(): string[] {
    const custom = this.config.get<string>('FF_CALENDAR_URL')?.trim();
    if (custom) return [custom, ...DEFAULT_URLS];
    return [...DEFAULT_URLS];
  }

  private async tryFetchUrl(url: string): Promise<FfEvent[] | null> {
    try {
      const res = await fetch(url, {
        headers: {
          Accept: 'application/json,text/plain,*/*',
          'User-Agent':
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache',
        },
      });

      if (res.status === 429) {
        this.rateLimitedUntil = Date.now() + RATE_LIMIT_COOLDOWN_MS;
        this.logger.warn(
          `FF HTTP 429 from ${url} — cooldown ${RATE_LIMIT_COOLDOWN_MS / 60_000}m`,
        );
        return null;
      }

      if (!res.ok) {
        this.logger.warn(`FF fetch failed ${url}: HTTP ${res.status}`);
        return null;
      }

      const body = await res.text();
      if (body.trimStart().startsWith('<')) {
        this.rateLimitedUntil = Date.now() + RATE_LIMIT_COOLDOWN_MS;
        this.logger.warn(`FF returned HTML from ${url} — treating as rate limit`);
        return null;
      }

      const events = JSON.parse(body) as FfEvent[];
      if (!Array.isArray(events)) {
        this.logger.warn(`FF payload not an array from ${url}`);
        return null;
      }

      this.logger.log(`FF live OK ${url}: ${events.length} events`);
      return events;
    } catch (err) {
      this.logger.error(`FF fetch error ${url}: ${(err as Error).message}`);
      return null;
    }
  }

  private writeCache(events: FfEvent[]) {
    this.memoryCache = events;
    try {
      mkdirSync(join(process.cwd(), '.cache'), { recursive: true });
      writeFileSync(this.cachePath, JSON.stringify(events), 'utf8');
    } catch (err) {
      this.logger.warn(`Could not write FF cache: ${(err as Error).message}`);
    }
  }

  private readCache(): FfEvent[] {
    if (this.memoryCache?.length) return this.memoryCache;
    try {
      if (existsSync(this.cachePath)) {
        const events = JSON.parse(
          readFileSync(this.cachePath, 'utf8'),
        ) as FfEvent[];
        this.memoryCache = events;
        return events;
      }
    } catch (err) {
      this.logger.warn(`Could not read FF cache: ${(err as Error).message}`);
    }
    this.logger.warn('No ForexFactory cache available');
    return [];
  }

  private seedSeenFromCacheIfEmpty() {
    if (this.seen.size > 0) return;
    const events = this.readCache();
    if (!events.length) return;
    const collectedAt = new Date().toISOString();
    for (const e of events) {
      if (!e.title || !e.date) continue;
      const item = this.toDto(e, collectedAt);
      this.seen.set(item.fingerprint, this.contentHash(item));
    }
    this.saveSeen();
    this.logger.log(
      `Seeded seen-set from cache (${this.seen.size}) — next publish only real deltas`,
    );
  }

  private loadSeen() {
    try {
      if (existsSync(this.seenPath)) {
        const obj = JSON.parse(readFileSync(this.seenPath, 'utf8')) as Record<
          string,
          string
        >;
        this.seen = new Map(Object.entries(obj));
      }
    } catch {
      this.seen = new Map();
    }
  }

  private saveSeen() {
    try {
      mkdirSync(join(process.cwd(), '.cache'), { recursive: true });
      writeFileSync(
        this.seenPath,
        JSON.stringify(Object.fromEntries(this.seen)),
        'utf8',
      );
    } catch {
      /* ignore */
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
