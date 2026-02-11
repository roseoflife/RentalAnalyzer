import type { AnnualSummary, AppConfig } from '../types';

export interface WealthComparison {
  year: number;
  propertyWealth: number;
  spWealth: number;
}

export function calculateWealthComparison(
  summaries: AnnualSummary[],
  config: AppConfig
): WealthComparison[] {
  const totalCashInvested =
    config.property.purchasePrice * (config.property.downPaymentPercent / 100) +
    config.property.closingCosts;

  const spRate = config.assumptions.spReturn / 100;
  let cumulativeCashFlow = 0;
  let prevSpWealth = totalCashInvested;

  return summaries.map((summary) => {
    const annualCashFlow = summary.netCashFlow + summary.taxBenefit;
    cumulativeCashFlow += annualCashFlow;

    // Property total wealth = current equity + cumulative cash flows
    const propertyWealth = summary.equity + cumulativeCashFlow;

    // S&P wealth = compound prior balance + reinvest this year's cash flow
    const spWealth = prevSpWealth * (1 + spRate) + annualCashFlow;
    prevSpWealth = spWealth;

    return {
      year: summary.year,
      propertyWealth: Math.round(propertyWealth),
      spWealth: Math.round(spWealth),
    };
  });
}

export function calculateNPV(
  cashFlows: number[],
  discountRate: number
): number {
  return cashFlows.reduce((npv, cf, i) => {
    return npv + cf / Math.pow(1 + discountRate / 100, i + 1);
  }, 0);
}
