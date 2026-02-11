import type { AppConfig, IncomeRecord, ExpenseRecord, ExpenseCategory } from '../types';
import { EXPENSE_CATEGORIES } from '../types';

/**
 * Generate projected income and expense records for N years beyond existing data.
 * Uses the last year of actual data as a template, applying rent growth to income
 * and inflation to expenses.
 */
export function generateProjectedData(
  existingIncome: IncomeRecord[],
  existingExpenses: ExpenseRecord[],
  config: AppConfig,
  projectionYears: number = 25
): { projectedIncome: IncomeRecord[]; projectedExpenses: ExpenseRecord[] } {
  if (existingIncome.length === 0 && existingExpenses.length === 0) {
    return { projectedIncome: [], projectedExpenses: [] };
  }

  const allYears = [
    ...existingIncome.map((r) => r.year),
    ...existingExpenses.map((r) => r.year),
  ];
  const lastYear = Math.max(...allYears);

  // Template: last year's data
  const templateIncome = existingIncome.filter((r) => r.year === lastYear);
  const templateExpenses = existingExpenses.filter((r) => r.year === lastYear);

  // Annual totals from template year
  const baseAnnualRental = templateIncome.reduce((s, r) => s + r.rentalIncome, 0);
  const baseAnnualOther = templateIncome.reduce((s, r) => s + r.otherIncome, 0);
  const baseAnnualVacancy = templateIncome.reduce((s, r) => s + r.vacancyLoss, 0);

  const baseExpenseByCategory: Record<string, number> = {};
  for (const cat of EXPENSE_CATEGORIES) {
    baseExpenseByCategory[cat] = templateExpenses
      .filter((e) => e.category === cat)
      .reduce((s, e) => s + e.amount, 0);
  }

  const rentGrowth = config.assumptions.rentGrowthRate / 100;
  const inflation = config.assumptions.inflationRate / 100;

  const projectedIncome: IncomeRecord[] = [];
  const projectedExpenses: ExpenseRecord[] = [];

  for (let i = 1; i <= projectionYears; i++) {
    const year = lastYear + i;
    const rentMultiplier = Math.pow(1 + rentGrowth, i);
    const inflationMultiplier = Math.pow(1 + inflation, i);

    // Create one record per month for income
    for (let month = 1; month <= 12; month++) {
      projectedIncome.push({
        year,
        month,
        rentalIncome: Math.round((baseAnnualRental / 12) * rentMultiplier * 100) / 100,
        otherIncome: Math.round((baseAnnualOther / 12) * rentMultiplier * 100) / 100,
        vacancyLoss: Math.round((baseAnnualVacancy / 12) * rentMultiplier * 100) / 100,
      });
    }

    // Create one record per category per month for expenses
    for (const cat of EXPENSE_CATEGORIES) {
      const baseMonthly = baseExpenseByCategory[cat] / 12;
      if (baseMonthly === 0) continue;
      // Mortgage expenses don't inflate — they're fixed by the loan
      const multiplier = cat === 'mortgage' ? 1 : inflationMultiplier;
      for (let month = 1; month <= 12; month++) {
        projectedExpenses.push({
          year,
          month,
          category: cat as ExpenseCategory,
          amount: Math.round(baseMonthly * multiplier * 100) / 100,
          description: 'Projected',
        });
      }
    }
  }

  return { projectedIncome, projectedExpenses };
}
