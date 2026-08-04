import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ANALYSIS_ASSET_KEYWORDS,
  AnalysisAsset,
  NewsAnalyzedDto,
  parseAnalysisAssets,
  ScoreUpdatedDto,
} from '@app/shared';

type AnalysisResult = Pick<
  NewsAnalyzedDto,
  | 'assets'
  | 'relevant'
  | 'sentiment'
  | 'analysisSummary'
  | 'aiScoreAdjustment'
  | 'finalScore'
>;

/**
 * Stub analyser scoped by ANALYSIS_ASSETS.
 * Only keywords for enabled assets are used for relevance + sentiment.
 */
@Injectable()
export class AiAnalysisService {
  private readonly enabledAssets: AnalysisAsset[];

  constructor(private readonly config: ConfigService) {
    this.enabledAssets = parseAnalysisAssets(
      this.config.get<string>('ANALYSIS_ASSETS'),
    );
  }

  analyze(item: ScoreUpdatedDto): AnalysisResult {
    const text = `${item.title} ${item.summary ?? ''}`.toLowerCase();
    const assets = this.matchAssets(text);

    if (assets.length === 0) {
      return {
        assets: [],
        relevant: false,
        sentiment: 'neutral',
        analysisSummary: `Not relevant to enabled assets [${this.enabledAssets.join(', ')}]`,
        aiScoreAdjustment: 0,
        finalScore: item.score,
      };
    }

    let bull = 0;
    let bear = 0;
    for (const asset of assets) {
      const profile = ANALYSIS_ASSET_KEYWORDS[asset];
      for (const w of profile.bullish) if (text.includes(w)) bull++;
      for (const w of profile.bearish) if (text.includes(w)) bear++;
    }

    // Generic market tone as a light fallback when asset-specific hints miss
    const genericBull = ['rise', 'growth', 'beat', 'surplus', 'hawkish', 'strong'];
    const genericBear = ['fall', 'cut', 'miss', 'deficit', 'dovish', 'weak', 'recession'];
    for (const w of genericBull) if (text.includes(w)) bull++;
    for (const w of genericBear) if (text.includes(w)) bear++;

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
      assets,
      relevant: true,
      sentiment,
      analysisSummary: `assets=[${assets.join(',')}] sentiment=${sentiment} adj=${aiScoreAdjustment}`,
      aiScoreAdjustment,
      finalScore,
    };
  }

  private matchAssets(text: string): AnalysisAsset[] {
    const matched: AnalysisAsset[] = [];
    for (const asset of this.enabledAssets) {
      const { relevance } = ANALYSIS_ASSET_KEYWORDS[asset];
      if (relevance.some((kw) => text.includes(kw))) {
        matched.push(asset);
      }
    }
    return matched;
  }
}
