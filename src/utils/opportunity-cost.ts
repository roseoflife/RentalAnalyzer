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

  return summaries.map((summary, index) => {
    cumulativeCashFlow += summary.netCashFlow + summary.taxBenefit;

    // Property total wealth = current equity + cumulative cash flows
    const propertyWealth = summary.equity + cumulativeCashFlow;

    // S&P wealth = initial investment compounded + cash flows reinvested
    const spWealth = totalCashInvested * Math.pow(1 + spRate, index + 1);

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
