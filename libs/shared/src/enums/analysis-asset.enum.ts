/**
 * Assets / topics the news pipeline can analyse for.
 * Enable a subset via ANALYSIS_ASSETS in .env (comma-separated), e.g.:
 *   ANALYSIS_ASSETS=gold,btc,eth
 */
export enum AnalysisAsset {
  GOLD = 'gold',
  SILVER = 'silver',
  BTC = 'btc',
  ETH = 'eth',
  CRYPTO = 'crypto',
  FOREX = 'forex',
  OIL = 'oil',
}

export const ALL_ANALYSIS_ASSETS = Object.values(AnalysisAsset);

/**
 * Parse ANALYSIS_ASSETS env value into a validated list.
 * Empty / unset → all assets (analyse everything we know about).
 */
export function parseAnalysisAssets(raw?: string | null): AnalysisAsset[] {
  if (!raw?.trim()) return [...ALL_ANALYSIS_ASSETS];

  const allowed = new Set(ALL_ANALYSIS_ASSETS);
  const parsed = raw
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter((s): s is AnalysisAsset => allowed.has(s as AnalysisAsset));

  return parsed.length > 0 ? parsed : [...ALL_ANALYSIS_ASSETS];
}
