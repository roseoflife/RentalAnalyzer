import type { AppConfig, IncomeRecord, ExpenseRecord, ExpenseCategory, PropertyConfig, MortgageConfig, MortgagePeriod, Assumptions, ManualFinancials } from '../types';
import type { TabId } from '../constants/defaults';
import { DEFAULT_CONFIG } from '../constants/defaults';
import { calculateMonthlyPayment, calculateLoanAmount } from '../utils/mortgage';

/**
 * Merge new records into existing, replacing any years that overlap.
 * This allows uploading multiple files for different years while
 * letting a newer file update data for years it covers.
 */
function mergeRecordsByYear<T extends { year: number }>(existing: T[], incoming: T[]): T[] {
  const incomingYears = new Set(incoming.map((r) => r.year));
  const kept = existing.filter((r) => !incomingYears.has(r.year));
  return [...kept, ...incoming].sort((a, b) => a.year - b.year);
}

export interface LoadedFile {
  name: string;
  type: string;
}

export type SubscriptionTier = 'free' | 'pro';

export interface AppState {
  config: AppConfig;
  incomeData: IncomeRecord[];
  expenseData: ExpenseRecord[];
  activeTab: TabId;
  dataLoaded: boolean;
  loadedFiles: LoadedFile[];
  subscription: SubscriptionTier;
}

export type AppAction =
  | { type: 'SET_PROPERTY_CONFIG'; payload: Partial<PropertyConfig> }
  | { type: 'SET_MORTGAGE_CONFIG'; payload: Partial<MortgageConfig> }
  | { type: 'SET_ASSUMPTIONS'; payload: Partial<Assumptions> }
  | { type: 'SET_MORTGAGE_PERIOD'; index: number; payload: Partial<MortgagePeriod> }
  | { type: 'ADD_MORTGAGE_PERIOD'; payload: MortgagePeriod }
  | { type: 'REMOVE_MORTGAGE_PERIOD'; index: number }
  | { type: 'SET_INCOME_DATA'; payload: IncomeRecord[]; file?: LoadedFile }
  | { type: 'SET_EXPENSE_DATA'; payload: ExpenseRecord[]; file?: LoadedFile }
  | { type: 'SET_ALL_DATA'; payload: { income: IncomeRecord[]; expenses: ExpenseRecord[] }; file?: LoadedFile }
  | { type: 'SET_EXTRA_MONTHLY_PAYMENT'; payload: number }
  | { type: 'SET_MANUAL_FINANCIALS'; payload: Partial<ManualFinancials> }
  | { type: 'SET_ACTIVE_TAB'; payload: TabId }
  | { type: 'SET_SUBSCRIPTION'; payload: SubscriptionTier }
  | { type: 'CLEAR_DATA' };

export const initialState: AppState = {
  config: DEFAULT_CONFIG,
  incomeData: [],
  expenseData: [],
  activeTab: 'setup',
  dataLoaded: false,
  loadedFiles: [],
  subscription: 'free',
};

function generateManualRecords(
  manual: ManualFinancials,
  config: AppConfig
): { income: IncomeRecord[]; expenses: ExpenseRecord[] } {
  const year = new Date().getFullYear();
  const income: IncomeRecord[] = [];
  const expenses: ExpenseRecord[] = [];

  const monthlyGross = manual.monthlyRent + manual.otherMonthlyIncome;
  const monthlyVacancy = monthlyGross * (manual.vacancyRate / 100);

  for (let month = 1; month <= 12; month++) {
    income.push({
      year,
      month,
      rentalIncome: manual.monthlyRent,
      otherIncome: manual.otherMonthlyIncome,
      vacancyLoss: monthlyVacancy,
    });

    // Mortgage expense from config
    if (config.mortgages.length > 0) {
      const lastMortgage = config.mortgages[config.mortgages.length - 1];
      expenses.push({
        year,
        month,
        category: 'mortgage',
        amount: lastMortgage.monthlyPayment + (config.extraMonthlyPayment ?? 0),
        description: 'Mortgage payment',
      });
    }

    // Spread annual expenses evenly across months
    for (const [cat, annual] of Object.entries(manual.annualExpenses)) {
      if (annual > 0) {
        expenses.push({
          year,
          month,
          category: cat as ExpenseCategory,
          amount: annual / 12,
          description: '',
        });
      }
    }
  }

  return { income, expenses };
}

function recalculateMortgage(
  property: PropertyConfig,
  mortgage: MortgageConfig
): MortgageConfig {
  const loanAmount = calculateLoanAmount(
    property.purchasePrice,
    property.downPaymentPercent
  );
  const monthlyPayment = calculateMonthlyPayment(
    loanAmount,
    mortgage.interestRate,
    mortgage.termYears
  );
  return {
    ...mortgage,
    loanAmount,
    monthlyPayment: Math.round(monthlyPayment * 100) / 100,
  };
}

function recalculatePeriodPayment(period: MortgagePeriod): MortgagePeriod {
  const monthlyPayment = calculateMonthlyPayment(
    period.loanAmount,
    period.interestRate,
    period.termYears
  );
  return { ...period, monthlyPayment: Math.round(monthlyPayment * 100) / 100 };
}

function deriveMortgageFromPeriods(mortgages: MortgagePeriod[]): MortgageConfig {
  const last = mortgages[mortgages.length - 1];
  return {
    loanAmount: last.loanAmount,
    interestRate: last.interestRate,
    termYears: last.termYears,
    monthlyPayment: last.monthlyPayment,
    startYear: last.startYear,
  };
}

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_PROPERTY_CONFIG': {
      const property = { ...state.config.property, ...action.payload };
      const mortgage = recalculateMortgage(property, state.config.mortgage);
      // Also update the first mortgage period's loan amount to stay in sync
      const mortgages = [...state.config.mortgages];
      if (mortgages.length > 0) {
        const loanAmount = calculateLoanAmount(property.purchasePrice, property.downPaymentPercent);
        mortgages[0] = recalculatePeriodPayment({ ...mortgages[0], loanAmount });
      }
      return {
        ...state,
        config: { ...state.config, property, mortgage, mortgages },
      };
    }
    case 'SET_MORTGAGE_CONFIG': {
      const partial = action.payload;
      const merged = { ...state.config.mortgage, ...partial };
      // Recalculate monthly payment if rate or term changed
      if ('interestRate' in partial || 'termYears' in partial) {
        merged.monthlyPayment = Math.round(
          calculateMonthlyPayment(merged.loanAmount, merged.interestRate, merged.termYears) * 100
        ) / 100;
      }
      return {
        ...state,
        config: { ...state.config, mortgage: merged },
      };
    }
    case 'SET_MORTGAGE_PERIOD': {
      const mortgages = [...state.config.mortgages];
      const updated = { ...mortgages[action.index], ...action.payload };
      // Recalculate payment if rate, term, or amount changed
      if ('interestRate' in action.payload || 'termYears' in action.payload || 'loanAmount' in action.payload) {
        mortgages[action.index] = recalculatePeriodPayment(updated);
      } else {
        mortgages[action.index] = updated;
      }
      return {
        ...state,
        config: {
          ...state.config,
          mortgages,
          mortgage: deriveMortgageFromPeriods(mortgages),
        },
      };
    }
    case 'ADD_MORTGAGE_PERIOD': {
      const period = recalculatePeriodPayment(action.payload);
      const mortgages = [...state.config.mortgages, period];
      return {
        ...state,
        config: {
          ...state.config,
          mortgages,
          mortgage: deriveMortgageFromPeriods(mortgages),
        },
      };
    }
    case 'REMOVE_MORTGAGE_PERIOD': {
      if (state.config.mortgages.length <= 1) return state;
      const mortgages = state.config.mortgages.filter((_, i) => i !== action.index);
      return {
        ...state,
        config: {
          ...state.config,
          mortgages,
          mortgage: deriveMortgageFromPeriods(mortgages),
        },
      };
    }
    case 'SET_ASSUMPTIONS':
      return {
        ...state,
        config: {
          ...state.config,
          assumptions: { ...state.config.assumptions, ...action.payload },
        },
      };
    case 'SET_EXTRA_MONTHLY_PAYMENT':
      return {
        ...state,
        config: { ...state.config, extraMonthlyPayment: action.payload },
      };
    case 'SET_INCOME_DATA': {
      const mergedIncome = mergeRecordsByYear(state.incomeData, action.payload);
      const loaded = mergedIncome.length > 0 || state.expenseData.length > 0;
      return {
        ...state,
        incomeData: mergedIncome,
        dataLoaded: loaded,
        activeTab: loaded ? 'past' : state.activeTab,
        loadedFiles: action.file ? [...state.loadedFiles, action.file] : state.loadedFiles,
      };
    }
    case 'SET_EXPENSE_DATA': {
      const mergedExpenses = mergeRecordsByYear(state.expenseData, action.payload);
      const loaded = state.incomeData.length > 0 || mergedExpenses.length > 0;
      return {
        ...state,
        expenseData: mergedExpenses,
        dataLoaded: loaded,
        activeTab: loaded ? 'past' : state.activeTab,
        loadedFiles: action.file ? [...state.loadedFiles, action.file] : state.loadedFiles,
      };
    }
    case 'SET_ALL_DATA': {
      const mergedIncome = mergeRecordsByYear(state.incomeData, action.payload.income);
      const mergedExpenses = mergeRecordsByYear(state.expenseData, action.payload.expenses);
      return {
        ...state,
        incomeData: mergedIncome,
        expenseData: mergedExpenses,
        dataLoaded: mergedIncome.length > 0 || mergedExpenses.length > 0,
        activeTab: 'past',
        loadedFiles: action.file ? [...state.loadedFiles, action.file] : state.loadedFiles,
      };
    }
    case 'SET_MANUAL_FINANCIALS': {
      const manualFinancials = {
        ...state.config.manualFinancials,
        ...action.payload,
        annualExpenses: {
          ...state.config.manualFinancials.annualExpenses,
          ...(action.payload.annualExpenses ?? {}),
        },
      };
      const newConfig = { ...state.config, manualFinancials };
      const records = generateManualRecords(manualFinancials, newConfig);
      const hasData = records.income.length > 0 && (manualFinancials.monthlyRent > 0 || manualFinancials.otherMonthlyIncome > 0);
      // Merge manual records (replaces current year)
      const currentYear = new Date().getFullYear();
      const keptIncome = state.incomeData.filter((r) => r.year !== currentYear);
      const keptExpenses = state.expenseData.filter((r) => r.year !== currentYear);
      return {
        ...state,
        config: newConfig,
        incomeData: [...keptIncome, ...records.income].sort((a, b) => a.year - b.year || a.month - b.month),
        expenseData: [...keptExpenses, ...records.expenses].sort((a, b) => a.year - b.year || a.month - b.month),
        dataLoaded: hasData || keptIncome.length > 0 || keptExpenses.length > 0,
        activeTab: hasData ? 'past' : state.activeTab,
      };
    }
    case 'SET_SUBSCRIPTION':
      return { ...state, subscription: action.payload };
    case 'SET_ACTIVE_TAB':
      return { ...state, activeTab: action.payload };
    case 'CLEAR_DATA':
      return {
        ...state,
        incomeData: [],
        expenseData: [],
        dataLoaded: false,
        activeTab: 'setup',
        loadedFiles: [],
      };
    default:
      return state;
  }
}
