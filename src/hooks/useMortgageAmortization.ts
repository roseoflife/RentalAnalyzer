import { useMemo } from 'react';
import type { MortgagePeriod } from '../types';
import type { MultiPeriodPayment } from '../utils/mortgage';
import { generateMultiPeriodSchedule } from '../utils/mortgage';

export function useMortgageAmortization(
  mortgages: MortgagePeriod[],
  extraMonthlyPayment: number = 0
): MultiPeriodPayment[] {
  return useMemo(
    () => generateMultiPeriodSchedule(mortgages, extraMonthlyPayment),
    [mortgages, extraMonthlyPayment]
  );
}
