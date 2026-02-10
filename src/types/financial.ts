import type { ExpenseCategory } from './property';

export interface IncomeRecord {
  year: number;
  month: number;
  rentalIncome: number;
  otherIncome: number;
  vacancyLoss: number;
}

export interface ExpenseRecord {
  year: number;
  month: number;
  category: ExpenseCategory;
  amount: number;
  description: string;
}

export interface AnnualSummary {
  year: number;
  grossIncome: number;
  vacancyLoss: number;
  effectiveGrossIncome: number;
  operatingExpenses: number;
  mortgagePayments: number;
  totalExpenses: number;
  noi: number;
  netCashFlow: number;
  capRate: number;
  cashOnCash: number;
  propertyValue: number;
  loanBalance: number;
  equity: number;
  principalPaid: number;
  interestPaid: number;
  depreciation: number;
  taxBenefit: number;
  totalROI: number;
  expenseBreakdown: Record<ExpenseCategory, number>;
}

export interface MortgagePayment {
  month: number;
  year: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
  totalPrincipal: number;
  totalInterest: number;
}

export interface ColumnMapping {
  year?: string;
  month?: string;
  rentalIncome?: string;
  otherIncome?: string;
  vacancyLoss?: string;
  category?: string;
  amount?: string;
  description?: string;
}

export type FileType = 'income' | 'expenses' | 'combined';
