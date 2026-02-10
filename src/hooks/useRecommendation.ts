import { useMemo } from 'react';
import type { AnnualSummary, AppConfig, RecommendationResult } from '../types';
import { calculateRecommendation } from '../utils/recommendation';

export function useRecommendation(
  summaries: AnnualSummary[],
  config: AppConfig
): RecommendationResult {
  return useMemo(
    () => calculateRecommendation(summaries, config),
    [summaries, config]
  );
}
