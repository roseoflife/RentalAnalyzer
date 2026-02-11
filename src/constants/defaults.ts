import type { AppConfig, ManualFinancials, MortgagePeriod } from '../types';

export const DEFAULT_MORTGAGES: MortgagePeriod[] = [
  {
    label: 'Original',
    loanAmount: 320000,
    interestRate: 4.5,
    termYears: 30,
    monthlyPayment: 1621.39,
    startYear: 2015,
  },
];

export const DEFAULT_MANUAL_FINANCIALS: ManualFinancials = {
  monthlyRent: 0,
  otherMonthlyIncome: 0,
  vacancyRate: 5,
  annualExpenses: {
    property_tax: 0,
    insurance: 0,
    maintenance: 0,
    repairs: 0,
    management: 0,
    utilities: 0,
    hoa: 0,
    capex: 0,
    other: 0,
  },
};

export const DEFAULT_CONFIG: AppConfig = {
  property: {
    purchasePrice: 400000,
    downPaymentPercent: 20,
    closingCosts: 8000,
    currentValue: 520000,
  },
  mortgage: {
    loanAmount: 320000,
    interestRate: 4.5,
    termYears: 30,
    monthlyPayment: 1621.39,
    startYear: 2015,
  },
  mortgages: DEFAULT_MORTGAGES,
  assumptions: {
    appreciationRate: 3,
    spReturn: 10,
    inflationRate: 3,
    discountRate: 8,
    taxRate: 25,
    sellingCosts: 6,
    capitalGainsTax: 15,
    depreciationYears: 27.5,
    rentGrowthRate: 3,
  },
  extraMonthlyPayment: 0,
  manualFinancials: DEFAULT_MANUAL_FINANCIALS,
};

export const CHART_COLORS = {
  income: '#22c55e',
  expenses: '#ef4444',
  netCashFlow: '#3b82f6',
  property: '#8b5cf6',
  sp500: '#f59e0b',
  appreciation: '#06b6d4',
  principalPaydown: '#8b5cf6',
  equity: '#10b981',
  mortgage: '#ef4444',
  property_tax: '#f97316',
  insurance: '#eab308',
  maintenance: '#22c55e',
  repairs: '#14b8a6',
  management: '#3b82f6',
  utilities: '#6366f1',
  hoa: '#8b5cf6',
  capex: '#d946ef',
  other: '#a855f7',
};

export type TabId = 'setup' | 'past' | 'future' | 'data';
