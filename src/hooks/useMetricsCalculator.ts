import { useMemo } from 'react';
import type { AppConfig, IncomeRecord, ExpenseRecord, AnnualSummary, OverallMetrics } from '../types';
import { calculateAnnualSummaries, calculateOverallMetrics } from '../utils/metrics';

export function useMetricsCalculator(
  income: IncomeRecord[],
  expenses: ExpenseRecord[],
  config: AppConfig
): {
  annualSummaries: AnnualSummary[];
  overallMetrics: OverallMetrics;
} {
  const annualSummaries = useMemo(
    () => calculateAnnualSummaries(income, expenses, config),
    [income, expenses, config]
  );

  const overallMetrics = useMemo(
    () => calculateOverallMetrics(annualSummaries, config),
    [annualSummaries, config]
  );

  return { annualSummaries, overallMetrics };
}
