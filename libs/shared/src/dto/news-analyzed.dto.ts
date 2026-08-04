import { ScoreUpdatedDto } from './score-updated.dto';

export class NewsAnalyzedDto extends ScoreUpdatedDto {
  sentiment: 'bullish' | 'bearish' | 'neutral';
  analysisSummary: string;
  aiScoreAdjustment: number;
  finalScore: number;
}
