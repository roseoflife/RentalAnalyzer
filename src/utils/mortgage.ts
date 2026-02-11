import type { MortgageConfig, MortgagePeriod } from '../types/property';
import type { MortgagePayment } from '../types/financial';

export function calculateMonthlyPayment(
  loanAmount: number,
  annualRate: number,
  termYears: number
): number {
  const monthlyRate = annualRate / 100 / 12;
  const numPayments = termYears * 12;

  if (monthlyRate === 0) return loanAmount / numPayments;

  return (
    (loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments))) /
    (Math.pow(1 + monthlyRate, numPayments) - 1)
  );
}

export function calculateLoanAmount(
  purchasePrice: number,
  downPaymentPercent: number
): number {
  return purchasePrice * (1 - downPaymentPercent / 100);
}

export function generateAmortizationSchedule(
  config: MortgageConfig
): MortgagePayment[] {
  const schedule: MortgagePayment[] = [];
  const monthlyRate = config.interestRate / 100 / 12;
  let balance = config.loanAmount;
  let totalPrincipal = 0;
  let totalInterest = 0;

  const numPayments = config.termYears * 12;

  for (let i = 1; i <= numPayments; i++) {
    const interest = balance * monthlyRate;
    const principal = config.monthlyPayment - interest;
    balance = Math.max(0, balance - principal);
    totalPrincipal += principal;
    totalInterest += interest;

    const yearOffset = Math.ceil(i / 12) - 1;

    schedule.push({
      month: i,
      year: config.startYear + yearOffset,
      payment: config.monthlyPayment,
      principal,
      interest,
      balance,
      totalPrincipal,
      totalInterest,
    });
  }

  return schedule;
}

export function getLoanBalanceAtMonth(
  config: MortgageConfig,
  monthNumber: number
): number {
  const monthlyRate = config.interestRate / 100 / 12;
  let balance = config.loanAmount;

  for (let i = 0; i < monthNumber; i++) {
    const interest = balance * monthlyRate;
    const principal = config.monthlyPayment - interest;
    balance = Math.max(0, balance - principal);
  }

  return balance;
}

export function getPrincipalAndInterestForYear(
  config: MortgageConfig,
  year: number
): { principal: number; interest: number } {
  const monthlyRate = config.interestRate / 100 / 12;
  let balance = config.loanAmount;
  const startMonth = (year - config.startYear) * 12;
  const endMonth = startMonth + 12;

  // Fast-forward to start of the year
  for (let i = 0; i < startMonth; i++) {
    const interest = balance * monthlyRate;
    const principal = config.monthlyPayment - interest;
    balance = Math.max(0, balance - principal);
  }

  let totalPrincipal = 0;
  let totalInterest = 0;

  for (let i = startMonth; i < endMonth; i++) {
    if (balance <= 0) break;
    const interest = balance * monthlyRate;
    const principal = Math.min(config.monthlyPayment - interest, balance);
    balance = Math.max(0, balance - principal);
    totalPrincipal += principal;
    totalInterest += interest;
  }

  return { principal: totalPrincipal, interest: totalInterest };
}

// --- Multi-mortgage period functions ---

/** Get the active mortgage period for a given year (sorted by startYear, last one whose startYear <= year) */
export function getMortgageForYear(
  mortgages: MortgagePeriod[],
  year: number
): MortgagePeriod | undefined {
  const sorted = [...mortgages].sort((a, b) => a.startYear - b.startYear);
  let active: MortgagePeriod | undefined;
  for (const m of sorted) {
    if (m.startYear <= year) active = m;
    else break;
  }
  return active;
}

/**
 * Simulate the multi-period balance month by month.
 * When a refi starts, the previous loan's balance is replaced by the new loanAmount.
 * Returns the balance at the end of the given absolute month (1-indexed from first mortgage start).
 */
function simulateMultiMortgageBalance(
  mortgages: MortgagePeriod[],
  toYear: number,
  toMonth: number, // 1-12
  extraMonthlyPayment: number = 0
): number {
  const sorted = [...mortgages].sort((a, b) => a.startYear - b.startYear);
  if (sorted.length === 0) return 0;

  const firstStart = sorted[0].startYear;
  const targetAbsMonth = (toYear - firstStart) * 12 + toMonth;

  let balance = sorted[0].loanAmount;
  let currentPeriodIdx = 0;
  let monthlyRate = sorted[0].interestRate / 100 / 12;
  let payment = sorted[0].monthlyPayment;

  for (let absMonth = 1; absMonth <= targetAbsMonth; absMonth++) {
    const calYear = firstStart + Math.floor((absMonth - 1) / 12);
    const calMonth = ((absMonth - 1) % 12) + 1;

    // Check if a new period starts at the beginning of this month
    if (currentPeriodIdx + 1 < sorted.length) {
      const nextPeriod = sorted[currentPeriodIdx + 1];
      if (calYear >= nextPeriod.startYear && (calYear > nextPeriod.startYear || calMonth === 1)) {
        // Only transition once per period
        if (currentPeriodIdx + 1 < sorted.length && sorted[currentPeriodIdx + 1] === nextPeriod) {
          currentPeriodIdx++;
          balance = nextPeriod.loanAmount;
          monthlyRate = nextPeriod.interestRate / 100 / 12;
          payment = nextPeriod.monthlyPayment;
        }
      }
    }

    if (balance <= 0) break;
    const interest = balance * monthlyRate;
    const totalPayment = payment + extraMonthlyPayment;
    const principal = Math.min(totalPayment - interest, balance);
    balance = Math.max(0, balance - principal);
  }

  return balance;
}

/** Get loan balance at end of a year across multiple mortgage periods */
export function getMultiMortgageBalanceAtMonth(
  mortgages: MortgagePeriod[],
  year: number,
  month: number,
  extraMonthlyPayment: number = 0
): number {
  return simulateMultiMortgageBalance(mortgages, year, month, extraMonthlyPayment);
}

/** Get principal and interest paid in a given year across mortgage periods */
export function getMultiMortgagePrincipalAndInterest(
  mortgages: MortgagePeriod[],
  year: number,
  extraMonthlyPayment: number = 0
): { principal: number; interest: number } {
  const sorted = [...mortgages].sort((a, b) => a.startYear - b.startYear);
  if (sorted.length === 0) return { principal: 0, interest: 0 };

  const firstStart = sorted[0].startYear;
  const yearStartAbsMonth = (year - firstStart) * 12 + 1;
  const yearEndAbsMonth = yearStartAbsMonth + 11;

  // Simulate from the beginning to get correct balance at start of year
  let balance = sorted[0].loanAmount;
  let currentPeriodIdx = 0;
  let monthlyRate = sorted[0].interestRate / 100 / 12;
  let payment = sorted[0].monthlyPayment;

  let totalPrincipal = 0;
  let totalInterest = 0;

  for (let absMonth = 1; absMonth <= yearEndAbsMonth; absMonth++) {
    const calYear = firstStart + Math.floor((absMonth - 1) / 12);
    const calMonth = ((absMonth - 1) % 12) + 1;

    // Check if a new period starts
    if (currentPeriodIdx + 1 < sorted.length) {
      const nextPeriod = sorted[currentPeriodIdx + 1];
      if (calYear >= nextPeriod.startYear && (calYear > nextPeriod.startYear || calMonth === 1)) {
        if (sorted[currentPeriodIdx + 1] === nextPeriod) {
          currentPeriodIdx++;
          balance = nextPeriod.loanAmount;
          monthlyRate = nextPeriod.interestRate / 100 / 12;
          payment = nextPeriod.monthlyPayment;
        }
      }
    }

    if (balance <= 0) break;
    const interest = balance * monthlyRate;
    const totalPayment = payment + extraMonthlyPayment;
    const principal = Math.min(totalPayment - interest, balance);
    balance = Math.max(0, balance - principal);

    if (absMonth >= yearStartAbsMonth) {
      totalPrincipal += principal;
      totalInterest += interest;
    }
  }

  return { principal: totalPrincipal, interest: totalInterest };
}

export interface MultiPeriodPayment extends MortgagePayment {
  periodLabel: string;
}

/** Generate a combined amortization schedule across all mortgage periods */
export function generateMultiPeriodSchedule(
  mortgages: MortgagePeriod[],
  extraMonthlyPayment: number = 0
): MultiPeriodPayment[] {
  const sorted = [...mortgages].sort((a, b) => a.startYear - b.startYear);
  if (sorted.length === 0) return [];

  const schedule: MultiPeriodPayment[] = [];
  const firstStart = sorted[0].startYear;

  // Determine total months: last period's start + its term
  const lastPeriod = sorted[sorted.length - 1];
  const totalEndYear = lastPeriod.startYear + lastPeriod.termYears;
  const totalMonths = (totalEndYear - firstStart) * 12;

  let balance = sorted[0].loanAmount;
  let currentPeriodIdx = 0;
  let monthlyRate = sorted[0].interestRate / 100 / 12;
  let payment = sorted[0].monthlyPayment;
  let periodLabel = sorted[0].label;
  let totalPrincipal = 0;
  let totalInterest = 0;

  for (let absMonth = 1; absMonth <= totalMonths; absMonth++) {
    const calYear = firstStart + Math.floor((absMonth - 1) / 12);
    const calMonth = ((absMonth - 1) % 12) + 1;

    // Check if a new period starts
    if (currentPeriodIdx + 1 < sorted.length) {
      const nextPeriod = sorted[currentPeriodIdx + 1];
      if (calYear >= nextPeriod.startYear && (calYear > nextPeriod.startYear || calMonth === 1)) {
        if (sorted[currentPeriodIdx + 1] === nextPeriod) {
          currentPeriodIdx++;
          balance = nextPeriod.loanAmount;
          monthlyRate = nextPeriod.interestRate / 100 / 12;
          payment = nextPeriod.monthlyPayment;
          periodLabel = nextPeriod.label;
          totalPrincipal = 0;
          totalInterest = 0;
        }
      }
    }

    if (balance <= 0) break;
    const interest = balance * monthlyRate;
    const totalPayment = payment + extraMonthlyPayment;
    const principal = Math.min(totalPayment - interest, balance);
    balance = Math.max(0, balance - principal);
    totalPrincipal += principal;
    totalInterest += interest;

    schedule.push({
      month: absMonth,
      year: calYear,
      payment: totalPayment,
      principal,
      interest,
      balance,
      totalPrincipal,
      totalInterest,
      periodLabel,
    });
  }

  return schedule;
}
