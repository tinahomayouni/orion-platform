import { Injectable } from '@nestjs/common';
import { RawNewsItemDto, SourceImpact } from '@app/shared';

export interface ScoringResult {
  score: number;
  breakdown: Record<string, unknown>;
}

const HIGH_SIGNAL_KEYWORDS = [
  'rate decision',
  'interest rate',
  'inflation',
  'cpi',
  'nonfarm',
  'gdp',
  'fed',
  'fomc',
  'unemployment',
];

const IMPACT_BASE_SCORE: Record<SourceImpact, number> = {
  [SourceImpact.HIGH]: 70,
  [SourceImpact.MEDIUM]: 45,
  [SourceImpact.LOW]: 20,
  [SourceImpact.UNKNOWN]: 30,
};

@Injectable()
export class NewsScoringService {
  score(item: Pick<RawNewsItemDto, 'title' | 'sourceImpact' | 'publishedAt'>): ScoringResult {
    let score = IMPACT_BASE_SCORE[item.sourceImpact] ?? 30;
    const matchedKeywords: string[] = [];

    const titleLower = item.title.toLowerCase();
    for (const kw of HIGH_SIGNAL_KEYWORDS) {
      if (titleLower.includes(kw)) {
        matchedKeywords.push(kw);
        score += 10;
      }
    }

    const ageHours =
      (Date.now() - new Date(item.publishedAt).getTime()) / 3_600_000;
    const freshnessBonus = ageHours < 1 ? 5 : 0;
    score += freshnessBonus;

    score = Math.max(0, Math.min(100, Math.round(score)));

    return {
      score,
      breakdown: {
        baseFromSourceImpact: IMPACT_BASE_SCORE[item.sourceImpact] ?? 30,
        matchedKeywords,
        freshnessBonus,
      },
    };
  }
}
