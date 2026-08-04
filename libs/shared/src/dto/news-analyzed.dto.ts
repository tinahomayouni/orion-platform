import { AnalysisAsset } from '../enums/analysis-asset.enum';
import { ScoreUpdatedDto } from './score-updated.dto';

export class NewsAnalyzedDto extends ScoreUpdatedDto {
  /** Assets this news matched against the enabled ANALYSIS_ASSETS set. */
  assets: AnalysisAsset[];
  /** True when at least one enabled asset matched the text. */
  relevant: boolean;
  sentiment: 'bullish' | 'bearish' | 'neutral';
  analysisSummary: string;
  aiScoreAdjustment: number;
  finalScore: number;
}
