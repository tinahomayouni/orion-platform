import { Injectable } from '@nestjs/common';
import { NewsAnalyzedDto, ScoreUpdatedDto } from '@app/shared';

/**
 * Stub analyser — keyword heuristics only.
 * Swap this body for a real LLM client when ready; queue contract stays the same.
 */
@Injectable()
export class AiAnalysisService {
  analyze(item: ScoreUpdatedDto): Omit<NewsAnalyzedDto, keyof ScoreUpdatedDto> &
    Pick<NewsAnalyzedDto, 'sentiment' | 'analysisSummary' | 'aiScoreAdjustment' | 'finalScore'> {
    const text = `${item.title} ${item.summary ?? ''}`.toLowerCase();

    const bullishHints = ['rise', 'growth', 'beat', 'surplus', 'hawkish', 'strong'];
    const bearishHints = ['fall', 'cut', 'miss', 'deficit', 'dovish', 'weak', 'recession'];

    let bull = 0;
    let bear = 0;
    for (const w of bullishHints) if (text.includes(w)) bull++;
    for (const w of bearishHints) if (text.includes(w)) bear++;

    let sentiment: NewsAnalyzedDto['sentiment'] = 'neutral';
    let aiScoreAdjustment = 0;
    if (bull > bear) {
      sentiment = 'bullish';
      aiScoreAdjustment = Math.min(10, bull * 3);
    } else if (bear > bull) {
      sentiment = 'bearish';
      aiScoreAdjustment = -Math.min(10, bear * 3);
    }

    const finalScore = Math.max(
      0,
      Math.min(100, Math.round(item.score + aiScoreAdjustment)),
    );

    return {
      sentiment,
      analysisSummary: `Stub analysis: sentiment=${sentiment}, adj=${aiScoreAdjustment}`,
      aiScoreAdjustment,
      finalScore,
    };
  }
}
