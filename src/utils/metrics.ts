import type { AppConfig, IncomeRecord, ExpenseRecord, AnnualSummary, ExpenseCategory, OverallMetrics } from '../types';
import { EXPENSE_CATEGORIES } from '../types';
import { getPrincipalAndInterestForYear, getLoanBalanceAtMonth, getMultiMortgagePrincipalAndInterest, getMultiMortgageBalanceAtMonth } from './mortgage';

export function calculateAnnualSummaries(
  income: IncomeRecord[],
  expenses: ExpenseRecord[],
  config: AppConfig
): AnnualSummary[] {
  const years = new Set<number>();
  income.forEach((r) => years.add(r.year));
  expenses.forEach((r) => years.add(r.year));

  const sortedYears = Array.from(years).sort((a, b) => a - b);
  const baseYear = sortedYears[0];

  return sortedYears.map((year, _yearIndex) => {
    const yearIncome = income.filter((r) => r.year === year);
    const yearExpenses = expenses.filter((r) => r.year === year);

    const rawGrossIncome = yearIncome.reduce(
      (sum, r) => sum + r.rentalIncome + r.otherIncome,
      0
    );
    const rawVacancyLoss = yearIncome.reduce((sum, r) => sum + r.vacancyLoss, 0);

    // Apply rent growth rate compounding from base year
    const rentGrowthMultiplier = Math.pow(
      1 + config.assumptions.rentGrowthRate / 100,
      year - baseYear
    );
    const grossIncome = rawGrossIncome * rentGrowthMultiplier;
    const vacancyLoss = rawVacancyLoss * rentGrowthMultiplier;
    const effectiveGrossIncome = grossIncome - vacancyLoss;

    // Expense breakdown
    const expenseBreakdown = {} as Record<ExpenseCategory, number>;
    EXPENSE_CATEGORIES.forEach((cat) => {
      expenseBreakdown[cat] = yearExpenses
        .filter((e) => e.category === cat)
        .reduce((sum, e) => sum + e.amount, 0);
    });

    const mortgagePayments = expenseBreakdown.mortgage;
    const operatingExpenses = Object.entries(expenseBreakdown)
      .filter(([cat]) => cat !== 'mortgage')
      .reduce((sum, [, amt]) => sum + amt, 0);

    const totalExpenses = operatingExpenses + mortgagePayments;
    const noi = effectiveGrossIncome - operatingExpenses;
    const netCashFlow = noi - mortgagePayments;

    // Property value with appreciation (use years since purchase, not array index)
    const firstMortgageStart = config.mortgages?.length > 0
      ? config.mortgages.reduce((min, m) => Math.min(min, m.startYear), config.mortgages[0].startYear)
      : config.mortgage.startYear;
    const yearsSincePurchase = year - firstMortgageStart + 1;
    const propertyValue =
      config.property.purchasePrice *
      Math.pow(1 + config.assumptions.appreciationRate / 100, yearsSincePurchase);

    const capRate = propertyValue > 0 ? (noi / propertyValue) * 100 : 0;

    // Cash invested
    const totalCashInvested =
      config.property.purchasePrice * (config.property.downPaymentPercent / 100) +
      config.property.closingCosts;

    const cashOnCash =
      totalCashInvested > 0 ? (netCashFlow / totalCashInvested) * 100 : 0;

    // Mortgage principal and interest (use multi-mortgage if available)
    const extra = config.extraMonthlyPayment ?? 0;
    const hasMultiMortgage = config.mortgages && config.mortgages.length > 0;
    const loanBalance = hasMultiMortgage
      ? getMultiMortgageBalanceAtMonth(config.mortgages, year, 12, extra)
      : getLoanBalanceAtMonth(config.mortgage, (year - config.mortgage.startYear + 1) * 12);
    const { principal: principalPaid, interest: interestPaid } = hasMultiMortgage
      ? getMultiMortgagePrincipalAndInterest(config.mortgages, year, extra)
      : getPrincipalAndInterestForYear(config.mortgage, year);

    const equity = propertyValue - loanBalance;

    // Depreciation (building only, ~80% of purchase price over 27.5 years)
    const buildingValue = config.property.purchasePrice * 0.8;
    const depreciation = buildingValue / config.assumptions.depreciationYears;

    // Tax benefit
    const taxBenefit =
      (interestPaid + depreciation) * (config.assumptions.taxRate / 100);

    // Total ROI = (Cash Flow + Appreciation + Principal Paydown + Tax Benefits) / Cash Invested
    const prevYearPropertyValue =
      yearsSincePurchase <= 1
        ? config.property.purchasePrice
        : config.property.purchasePrice *
          Math.pow(1 + config.assumptions.appreciationRate / 100, yearsSincePurchase - 1);
    const appreciation = propertyValue - prevYearPropertyValue;

    const totalROI =
      totalCashInvested > 0
        ? ((netCashFlow + appreciation + principalPaid + taxBenefit) /
            totalCashInvested) *
          100
        : 0;

    return {
      year,
      grossIncome,
      vacancyLoss,
      effectiveGrossIncome,
      operatingExpenses,
      mortgagePayments,
      totalExpenses,
      noi,
      netCashFlow,
      capRate,
      cashOnCash,
      propertyValue,
      loanBalance,
      equity,
      principalPaid,
      interestPaid,
      depreciation,
      taxBenefit,
      totalROI,
      expenseBreakdown,
    };
  });
}

export function calculateOverallMetrics(
  summaries: AnnualSummary[],
  config: AppConfig
): OverallMetrics {
  if (summaries.length === 0) {
    return {
      totalNOI: 0,
      avgCapRate: 0,
      avgCashOnCash: 0,
      totalNetCashFlow: 0,
      totalROI: 0,
      annualizedROI: 0,
      currentEquity: 0,
      totalAppreciation: 0,
      totalPrincipalPaid: 0,
      totalTaxBenefits: 0,
      spComparison: 0,
      propertyTotalWealth: 0,
    };
  }

  const totalNOI = summaries.reduce((sum, s) => sum + s.noi, 0);
  const avgCapRate =
    summaries.reduce((sum, s) => sum + s.capRate, 0) / summaries.length;
  const avgCashOnCash =
    summaries.reduce((sum, s) => sum + s.cashOnCash, 0) / summaries.length;
  const totalNetCashFlow = summaries.reduce((sum, s) => sum + s.netCashFlow, 0);
  const totalPrincipalPaid = summaries.reduce(
    (sum, s) => sum + s.principalPaid,
    0
  );
  const totalTaxBenefits = summaries.reduce((sum, s) => sum + s.taxBenefit, 0);

  const lastSummary = summaries[summaries.length - 1];
  const currentEquity = lastSummary.equity;
  const totalAppreciation =
    lastSummary.propertyValue - config.property.purchasePrice;

  // Total cash invested
  const totalCashInvested =
    config.property.purchasePrice * (config.property.downPaymentPercent / 100) +
    config.property.closingCosts;

  // Total ROI
  const totalROI =
    totalCashInvested > 0
      ? ((totalNetCashFlow +
          totalAppreciation +
          totalPrincipalPaid +
          totalTaxBenefits) /
          totalCashInvested) *
        100
      : 0;

  // Annualized ROI (geometric mean)
  const years = summaries.length;
  const annualizedROI =
    years > 0
      ? (Math.pow(1 + totalROI / 100, 1 / years) - 1) * 100
      : 0;

  // S&P 500 comparison: compound initial cash + reinvest each year's cash flow
  const spRate = config.assumptions.spReturn / 100;
  let spComparison = totalCashInvested;
  for (const s of summaries) {
    spComparison = spComparison * (1 + spRate) + s.netCashFlow + s.taxBenefit;
  }

  // Property total wealth = equity + cumulative cash flow + tax benefits
  const propertyTotalWealth =
    currentEquity + totalNetCashFlow + totalTaxBenefits;

  return {
    totalNOI,
    avgCapRate,
    avgCashOnCash,
    totalNetCashFlow,
    totalROI,
    annualizedROI,
    currentEquity,
    totalAppreciation,
    totalPrincipalPaid,
    totalTaxBenefits,
    spComparison,
    propertyTotalWealth,
  };
}
