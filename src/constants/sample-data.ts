import type { IncomeRecord, ExpenseRecord } from '../types';

function generateSampleIncome(): IncomeRecord[] {
  const records: IncomeRecord[] = [];
  let baseRent = 2500;

  for (let year = 2015; year <= 2024; year++) {
    // Rent increases ~3% per year with some variation
    if (year > 2015) {
      baseRent = Math.round(baseRent * (1 + 0.025 + Math.random() * 0.02));
    }

    for (let month = 1; month <= 12; month++) {
      // Occasional vacancy
      const hasVacancy = Math.random() < 0.05;
      const vacancyLoss = hasVacancy ? baseRent : 0;
      const otherIncome = month % 3 === 0 ? Math.round(50 + Math.random() * 100) : 0;

      records.push({
        year,
        month,
        rentalIncome: baseRent,
        otherIncome,
        vacancyLoss,
      });
    }
  }

  return records;
}

function generateSampleExpenses(): ExpenseRecord[] {
  const records: ExpenseRecord[] = [];
  let baseMortgage = 1621;
  let baseTax = 420;
  let baseInsurance = 150;

  for (let year = 2015; year <= 2024; year++) {
    // Taxes and insurance increase over time
    if (year > 2015) {
      baseTax = Math.round(baseTax * 1.03);
      baseInsurance = Math.round(baseInsurance * 1.02);
    }

    for (let month = 1; month <= 12; month++) {
      // Mortgage payment every month
      records.push({
        year,
        month,
        category: 'mortgage',
        amount: baseMortgage,
        description: 'Monthly mortgage payment',
      });

      // Property tax every month
      records.push({
        year,
        month,
        category: 'property_tax',
        amount: baseTax,
        description: 'Monthly property tax',
      });

      // Insurance every month
      records.push({
        year,
        month,
        category: 'insurance',
        amount: baseInsurance,
        description: 'Monthly insurance premium',
      });

      // Maintenance - random months
      if (Math.random() < 0.3) {
        records.push({
          year,
          month,
          category: 'maintenance',
          amount: Math.round(100 + Math.random() * 300),
          description: 'General maintenance',
        });
      }

      // Repairs - occasional
      if (Math.random() < 0.1) {
        records.push({
          year,
          month,
          category: 'repairs',
          amount: Math.round(200 + Math.random() * 1500),
          description: 'Property repair',
        });
      }

      // Utilities
      if (Math.random() < 0.4) {
        records.push({
          year,
          month,
          category: 'utilities',
          amount: Math.round(80 + Math.random() * 120),
          description: 'Common area utilities',
        });
      }
    }

    // Annual capex
    if (year % 3 === 0) {
      records.push({
        year,
        month: 6,
        category: 'capex',
        amount: Math.round(2000 + Math.random() * 5000),
        description: 'Capital improvement',
      });
    }
  }

  return records;
}

// Use seeded random for consistent sample data
let _seed = 42;
const _origRandom = Math.random;

function seededRandom(): number {
  _seed = (_seed * 16807) % 2147483647;
  return (_seed - 1) / 2147483646;
}

export function getSampleData(): {
  income: IncomeRecord[];
  expenses: ExpenseRecord[];
} {
  // Temporarily replace Math.random with seeded version for consistency
  _seed = 42;
  Math.random = seededRandom;
  const income = generateSampleIncome();
  const expenses = generateSampleExpenses();
  Math.random = _origRandom;
  return { income, expenses };
}
