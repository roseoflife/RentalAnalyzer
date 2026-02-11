export interface PropertyConfig {
  purchasePrice: number;
  downPaymentPercent: number;
  closingCosts: number;
  currentValue: number;
}

export interface MortgageConfig {
  loanAmount: number;
  interestRate: number;
  termYears: 15 | 20 | 25 | 30;
  monthlyPayment: number;
  startYear: number;
}

export interface MortgagePeriod {
  label: string;
  loanAmount: number;
  interestRate: number;
  termYears: 15 | 20 | 25 | 30;
  monthlyPayment: number;
  startYear: number;
}

export interface Assumptions {
  appreciationRate: number;
  spReturn: number;
  inflationRate: number;
  discountRate: number;
  taxRate: number;
  sellingCosts: number;
  capitalGainsTax: number;
  depreciationYears: number;
  rentGrowthRate: number;
}

export interface ManualFinancials {
  monthlyRent: number;
  otherMonthlyIncome: number;
  vacancyRate: number;
  annualExpenses: Record<Exclude<ExpenseCategory, 'mortgage'>, number>;
}

export interface AppConfig {
  property: PropertyConfig;
  mortgage: MortgageConfig;
  mortgages: MortgagePeriod[];
  assumptions: Assumptions;
  extraMonthlyPayment: number;
  manualFinancials: ManualFinancials;
}

export type ExpenseCategory =
  | 'mortgage'
  | 'property_tax'
  | 'insurance'
  | 'maintenance'
  | 'repairs'
  | 'management'
  | 'utilities'
  | 'hoa'
  | 'capex'
  | 'other';

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'mortgage',
  'property_tax',
  'insurance',
  'maintenance',
  'repairs',
  'management',
  'utilities',
  'hoa',
  'capex',
  'other',
];

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  mortgage: 'Mortgage',
  property_tax: 'Property Tax',
  insurance: 'Insurance',
  maintenance: 'Maintenance',
  repairs: 'Repairs',
  management: 'Management',
  utilities: 'Utilities',
  hoa: 'HOA',
  capex: 'Capital Expenditure',
  other: 'Other',
};
