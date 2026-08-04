export const QUEUES = {
  RAW_FOREXFACTORY: 'raw.forexfactory',
  RAW_INVESTOR: 'raw.investor',
  NEWS_COLLECTED: 'news.collected',
  SCORE_UPDATED: 'score.updated',
  NEWS_FOR_ANALYSIS: 'news.for_analysis',
  NEWS_ANALYZED: 'news.analyzed',
} as const;

/** Bound prefetch so a burst of publishes cannot overwhelm a consumer. */
export const CONSUMER_PREFETCH = 10;
