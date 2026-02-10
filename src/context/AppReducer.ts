import type { AppConfig, IncomeRecord, ExpenseRecord, PropertyConfig, MortgageConfig, MortgagePeriod, Assumptions } from '../types';
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

export interface AppState {
  config: AppConfig;
  incomeData: IncomeRecord[];
  expenseData: ExpenseRecord[];
  activeTab: TabId;
  dataLoaded: boolean;
  loadedFiles: LoadedFile[];
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
  | { type: 'SET_ACTIVE_TAB'; payload: TabId }
  | { type: 'CLEAR_DATA' };

export const initialState: AppState = {
  config: DEFAULT_CONFIG,
  incomeData: [],
  expenseData: [],
  activeTab: 'setup',
  dataLoaded: false,
  loadedFiles: [],
};

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
