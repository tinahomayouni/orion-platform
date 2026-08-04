import { AnalysisAsset } from '../enums/analysis-asset.enum';

export type AssetKeywordProfile = {
  /** If title/summary matches any of these, the news is about this asset. */
  relevance: string[];
  bullish: string[];
  bearish: string[];
};

/**
 * Keyword profiles per AnalysisAsset.
 * Edit here to teach the stub analyser what each asset "looks like".
 */
export const ANALYSIS_ASSET_KEYWORDS: Record<AnalysisAsset, AssetKeywordProfile> = {
  [AnalysisAsset.GOLD]: {
    relevance: [
      'gold',
      'xau',
      'xauusd',
      'bullion',
      'precious metal',
      'yellow metal',
    ],
    bullish: [
      'rally',
      'surge',
      'safe haven',
      'flight to safety',
      'geopolitical',
      'dollar weakness',
      'weak dollar',
      'rate cut',
    ],
    bearish: [
      'decline',
      'sell-off',
      'selloff',
      'strong dollar',
      'dollar strength',
      'rate hike',
      'risk appetite',
    ],
  },
  [AnalysisAsset.SILVER]: {
    relevance: ['silver', 'xag', 'xagusd'],
    bullish: ['rally', 'surge', 'industrial demand', 'safe haven'],
    bearish: ['decline', 'sell-off', 'selloff', 'strong dollar'],
  },
  [AnalysisAsset.BTC]: {
    relevance: ['bitcoin', 'btc', 'btc/usd', 'btcusd'],
    bullish: [
      'halving',
      'etf approval',
      'etf inflows',
      'adoption',
      'all-time high',
      'ath',
      'bull run',
    ],
    bearish: [
      'crash',
      'hack',
      'ban',
      'regulation crackdown',
      'etf outflows',
      'bear market',
    ],
  },
  [AnalysisAsset.ETH]: {
    relevance: ['ethereum', 'eth', 'eth/usd', 'ethusd', 'ether'],
    bullish: ['upgrade', 'staking', 'etf', 'adoption', 'defi boom'],
    bearish: ['crash', 'hack', 'gas fees', 'bear market', 'sell-off'],
  },
  [AnalysisAsset.CRYPTO]: {
    relevance: [
      'crypto',
      'cryptocurrency',
      'blockchain',
      'altcoin',
      'defi',
      'stablecoin',
      'digital asset',
    ],
    bullish: ['adoption', 'etf', 'bullish', 'inflows', 'rally'],
    bearish: ['crash', 'ban', 'hack', 'regulation', 'outflows', 'bearish'],
  },
  [AnalysisAsset.FOREX]: {
    relevance: [
      'forex',
      'fx ',
      'usd',
      'eur',
      'gbp',
      'jpy',
      'currency',
      'dollar',
      'euro',
      'yen',
    ],
    bullish: ['hawkish', 'rate hike', 'strong', 'beat', 'surplus'],
    bearish: ['dovish', 'rate cut', 'weak', 'miss', 'deficit'],
  },
  [AnalysisAsset.OIL]: {
    relevance: ['oil', 'crude', 'wti', 'brent', 'petroleum', 'opec'],
    bullish: ['supply cut', 'opec cut', 'geopolitical', 'demand surge'],
    bearish: ['oversupply', 'demand drop', 'glut', 'production hike'],
  },
};
