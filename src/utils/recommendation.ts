import type { AnnualSummary, AppConfig, RecommendationResult, RecommendationFactor, RecommendationReason } from '../types';
import { calculateNPV } from './opportunity-cost';

function linearRegression(values: number[]): { slope: number; r2: number } {
  const n = values.length;
  if (n < 2) return { slope: 0, r2: 0 };

  const xMean = (n - 1) / 2;
  const yMean = values.reduce((a, b) => a + b, 0) / n;

  let ssXY = 0;
  let ssXX = 0;
  let ssTot = 0;

  for (let i = 0; i < n; i++) {
    ssXY += (i - xMean) * (values[i] - yMean);
    ssXX += (i - xMean) * (i - xMean);
    ssTot += (values[i] - yMean) * (values[i] - yMean);
  }

  const slope = ssXX > 0 ? ssXY / ssXX : 0;
  const ssRes = values.reduce((sum, y, i) => {
    const predicted = yMean + slope * (i - xMean);
    return sum + (y - predicted) * (y - predicted);
  }, 0);

  const r2 = ssTot > 0 ? 1 - ssRes / ssTot : 0;
  return { slope, r2 };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function calculateRecommendation(
  summaries: AnnualSummary[],
  config: AppConfig
): RecommendationResult {
  if (summaries.length < 2) {
    return {
      score: 0,
      verdict: 'Neutral',
      reasons: [{ text: 'Not enough data for recommendation', positive: false }],
      factors: [],
    };
  }

  const totalCashInvested =
    config.property.purchasePrice * (config.property.downPaymentPercent / 100) +
    config.property.closingCosts;

  const reasons: RecommendationReason[] = [];
  const factors: RecommendationFactor[] = [];

  // 1. Cash flow trend (25%)
  const cashFlows = summaries.map((s) => s.netCashFlow);
  const cfRegression = linearRegression(cashFlows);
  const cfTrendScore = clamp(
    (cfRegression.slope / (totalCashInvested * 0.01)) * 50,
    -100,
    100
  );
  factors.push({
    name: 'Cash Flow Trend',
    weight: 0.25,
    score: cfTrendScore,
    weightedScore: cfTrendScore * 0.25,
    description:
      cfRegression.slope > 0
        ? `Cash flow improving by $${Math.round(cfRegression.slope)}/yr`
        : `Cash flow declining by $${Math.round(Math.abs(cfRegression.slope))}/yr`,
  });
  reasons.push({
    text: cfRegression.slope > 0
      ? `Cash flow has been improving over time (+$${Math.round(cfRegression.slope)}/yr)`
      : `Cash flow has been declining over time (-$${Math.round(Math.abs(cfRegression.slope))}/yr)`,
    positive: cfRegression.slope > 0,
  });

  // 2. Opportunity cost vs S&P 500 (20%)
  const years = summaries.length;
  const spWealth = totalCashInvested * Math.pow(1 + config.assumptions.spReturn / 100, years);
  const lastSummary = summaries[summaries.length - 1];
  const cumulativeCashFlow = summaries.reduce((s, r) => s + r.netCashFlow + r.taxBenefit, 0);
  const propertyWealth = lastSummary.equity + cumulativeCashFlow;
  const wealthRatio = spWealth > 0 ? propertyWealth / spWealth : 1;
  const opCostScore = clamp((wealthRatio - 1) * 200, -100, 100);
  factors.push({
    name: 'Opportunity Cost vs S&P 500',
    weight: 0.2,
    score: opCostScore,
    weightedScore: opCostScore * 0.2,
    description:
      propertyWealth > spWealth
        ? `Property outperforming S&P 500 by $${Math.round(propertyWealth - spWealth).toLocaleString()}`
        : `S&P 500 outperforming property by $${Math.round(spWealth - propertyWealth).toLocaleString()}`,
  });
  reasons.push({
    text:
      propertyWealth > spWealth
        ? `Property total wealth ($${Math.round(propertyWealth).toLocaleString()}) exceeds S&P 500 alternative ($${Math.round(spWealth).toLocaleString()})`
        : `S&P 500 alternative ($${Math.round(spWealth).toLocaleString()}) outperforms property total wealth ($${Math.round(propertyWealth).toLocaleString()})`,
    positive: propertyWealth > spWealth,
  });

  // 3. Cap rate vs market average (15%)
  const avgCapRate = summaries.reduce((s, r) => s + r.capRate, 0) / summaries.length;
  const marketCapRate = 5; // typical market average
  const capRateScore = clamp((avgCapRate - marketCapRate) * 20, -100, 100);
  factors.push({
    name: 'Cap Rate vs Market',
    weight: 0.15,
    score: capRateScore,
    weightedScore: capRateScore * 0.15,
    description: `Average cap rate ${avgCapRate.toFixed(1)}% vs ${marketCapRate}% market average`,
  });
  reasons.push({
    text: avgCapRate >= marketCapRate
      ? `Cap rate (${avgCapRate.toFixed(1)}%) meets or exceeds market average (${marketCapRate}%)`
      : `Cap rate (${avgCapRate.toFixed(1)}%) below market average (${marketCapRate}%)`,
    positive: avgCapRate >= marketCapRate,
  });

  // 4. Equity growth rate (15%) — use CAGR
  const equities = summaries.map((s) => s.equity);
  const equityGrowthRate = equities.length >= 2 && equities[0] > 0
    ? (Math.pow(equities[equities.length - 1] / equities[0], 1 / (equities.length - 1)) - 1) * 100
    : 0;
  const equityScore = clamp((equityGrowthRate - 5) * 20, -100, 100);
  factors.push({
    name: 'Equity Growth Rate',
    weight: 0.15,
    score: equityScore,
    weightedScore: equityScore * 0.15,
    description: `Equity growing at ${equityGrowthRate.toFixed(1)}% per year`,
  });
  reasons.push({
    text: `Equity has grown at ${equityGrowthRate.toFixed(1)}% annually`,
    positive: equityGrowthRate > 5,
  });

  // 5. NPV of continuing to hold (15%)
  const futureCashFlows = Array.from({ length: 5 }, (_, i) => {
    const lastCF = cashFlows[cashFlows.length - 1];
    return lastCF * Math.pow(1 + config.assumptions.inflationRate / 100, i + 1);
  });
  // Add terminal value (sale in year 5)
  const futurePropertyValue =
    lastSummary.propertyValue *
    Math.pow(1 + config.assumptions.appreciationRate / 100, 5);
  const sellingCosts = futurePropertyValue * (config.assumptions.sellingCosts / 100);
  const capitalGains = futurePropertyValue - config.property.purchasePrice;
  const capitalGainsTax = Math.max(0, capitalGains) * (config.assumptions.capitalGainsTax / 100);
  futureCashFlows[4] += futurePropertyValue - sellingCosts - capitalGainsTax - lastSummary.loanBalance;

  const npv = calculateNPV(futureCashFlows, config.assumptions.discountRate);
  const npvRatio = totalCashInvested > 0 ? npv / totalCashInvested : 0;
  const npvScore = clamp(npvRatio * 100, -100, 100);
  factors.push({
    name: 'NPV of Holding',
    weight: 0.15,
    score: npvScore,
    weightedScore: npvScore * 0.15,
    description: `NPV of holding 5 more years: $${Math.round(npv).toLocaleString()}`,
  });
  reasons.push({
    text: npv > 0
      ? `Positive NPV ($${Math.round(npv).toLocaleString()}) for holding 5 more years`
      : `Negative NPV ($${Math.round(npv).toLocaleString()}) for holding 5 more years`,
    positive: npv > 0,
  });

  // 6. Cash-on-cash trend (10%)
  const cocValues = summaries.map((s) => s.cashOnCash);
  const cocRegression = linearRegression(cocValues);
  const cocTrendScore = clamp(cocRegression.slope * 50, -100, 100);
  factors.push({
    name: 'Cash-on-Cash Trend',
    weight: 0.1,
    score: cocTrendScore,
    weightedScore: cocTrendScore * 0.1,
    description:
      cocRegression.slope > 0
        ? `Cash-on-cash return improving by ${cocRegression.slope.toFixed(2)}%/yr`
        : `Cash-on-cash return declining by ${Math.abs(cocRegression.slope).toFixed(2)}%/yr`,
  });

  // Calculate total weighted score
  const totalScore = factors.reduce((sum, f) => sum + f.weightedScore, 0);
  const clampedScore = clamp(Math.round(totalScore), -100, 100);

  let verdict: RecommendationResult['verdict'];
  if (clampedScore >= 60) verdict = 'Strong Keep';
  else if (clampedScore >= 20) verdict = 'Keep';
  else if (clampedScore >= -20) verdict = 'Neutral';
  else if (clampedScore >= -60) verdict = 'Sell';
  else verdict = 'Strong Sell';

  return { score: clampedScore, verdict, reasons, factors };
}
