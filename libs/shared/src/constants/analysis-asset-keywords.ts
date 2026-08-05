import { AnalysisAsset } from '../enums/analysis-asset.enum';

export type AssetKeywordProfile = {
  /** If title/summary matches any of these, the news is about this asset. */
  relevance: string[];
  bullish: string[];
  bearish: string[];
};

/** Macro calendar events that move risk assets / metals (ForexFactory rarely names the asset). */
const MACRO_DRIVERS = [
  'interest rate',
  'rate decision',
  'federal funds',
  'fed ',
  'fomc',
  'inflation',
  'cpi',
  'core cpi',
  'pce',
  'nonfarm',
  'non-farm',
  'unemployment',
  'gdp',
  'treasury',
  'dollar index',
  'ism manufacturing',
  'ism services',
  'retail sales',
  'adp',
  'ppi',
  'consumer confidence',
  'powell',
];

const MACRO_BULLISH = [
  'rally',
  'surge',
  'rate cut',
  'dovish',
  'miss',
  'below forecast',
  'lower',
  'weak dollar',
  'dollar weakness',
];

const MACRO_BEARISH = [
  'decline',
  'sell-off',
  'selloff',
  'rate hike',
  'hawkish',
  'beat',
  'above forecast',
  'higher',
  'strong dollar',
  'dollar strength',
];

/**
 * Keyword profiles per AnalysisAsset.
 * FF/Investing calendars rarely say "bitcoin"/"gold" — macro drivers fill the gap.
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
      ...MACRO_DRIVERS,
    ],
    bullish: [
      ...MACRO_BULLISH,
      'safe haven',
      'flight to safety',
      'geopolitical',
    ],
    bearish: [...MACRO_BEARISH, 'risk appetite'],
  },
  [AnalysisAsset.SILVER]: {
    relevance: ['silver', 'xag', 'xagusd', 'precious metal', ...MACRO_DRIVERS],
    bullish: [...MACRO_BULLISH, 'industrial demand', 'safe haven'],
    bearish: [...MACRO_BEARISH],
  },
  [AnalysisAsset.BTC]: {
    relevance: [
      'bitcoin',
      'btc',
      'btc/usd',
      'btcusd',
      ...MACRO_DRIVERS,
    ],
    bullish: [
      ...MACRO_BULLISH,
      'halving',
      'etf approval',
      'etf inflows',
      'adoption',
      'all-time high',
      'ath',
      'bull run',
      'risk on',
    ],
    bearish: [
      ...MACRO_BEARISH,
      'crash',
      'hack',
      'ban',
      'regulation crackdown',
      'etf outflows',
      'bear market',
      'risk off',
    ],
  },
  [AnalysisAsset.ETH]: {
    relevance: [
      'ethereum',
      'ether',
      'eth/usd',
      'ethusd',
      ' eth ',
      ...MACRO_DRIVERS,
    ],
    bullish: [
      ...MACRO_BULLISH,
      'upgrade',
      'staking',
      'etf',
      'adoption',
      'defi boom',
      'risk on',
    ],
    bearish: [
      ...MACRO_BEARISH,
      'crash',
      'hack',
      'gas fees',
      'bear market',
      'risk off',
    ],
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
      ...MACRO_DRIVERS,
    ],
    bullish: [...MACRO_BULLISH, 'adoption', 'etf', 'bullish', 'inflows', 'risk on'],
    bearish: [
      ...MACRO_BEARISH,
      'crash',
      'ban',
      'hack',
      'regulation',
      'outflows',
      'bearish',
      'risk off',
    ],
  },
  [AnalysisAsset.FOREX]: {
    // Almost all FF calendar rows are FX-relevant (country + currency in summary).
    relevance: [
      'forex',
      'fx ',
      'usd',
      'eur',
      'gbp',
      'jpy',
      'aud',
      'nzd',
      'cad',
      'chf',
      'cny',
      'currency',
      'dollar',
      'euro',
      'yen',
      'pound',
      'pmi',
      'employment',
      'trade balance',
      'speaks',
      ...MACRO_DRIVERS,
    ],
    bullish: [...MACRO_BULLISH, 'hawkish', 'surplus', 'strong'],
    bearish: [...MACRO_BEARISH, 'dovish', 'deficit', 'weak'],
  },
  [AnalysisAsset.OIL]: {
    relevance: [
      'oil',
      'crude',
      'wti',
      'brent',
      'petroleum',
      'opec',
      'crude oil inventories',
      'api crude',
      'eia',
      ...MACRO_DRIVERS.filter((k) =>
        ['gdp', 'ism manufacturing', 'retail sales'].includes(k),
      ),
    ],
    bullish: [
      ...MACRO_BULLISH,
      'supply cut',
      'opec cut',
      'geopolitical',
      'demand surge',
      'draw',
    ],
    bearish: [
      ...MACRO_BEARISH,
      'oversupply',
      'demand drop',
      'glut',
      'production hike',
      'build',
    ],
  },
};
