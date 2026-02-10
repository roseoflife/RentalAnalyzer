import { useState } from 'react';
import type { MultiPeriodPayment } from '../../utils/mortgage';
import { Card } from '../ui/Card';
import { formatCurrencyDetailed } from '../../utils/formatters';

interface MortgageScheduleTableProps {
  schedule: MultiPeriodPayment[];
}

export function MortgageScheduleTable({ schedule }: MortgageScheduleTableProps) {
  const [showMonthly, setShowMonthly] = useState(false);

  // Group by year for annual view
  const annualData = !showMonthly
    ? Object.values(
        schedule.reduce<Record<number, {
          year: number;
          payments: number;
          principal: number;
          interest: number;
          balance: number;
          periodLabel: string;
        }>>((acc, pmt) => {
          if (!acc[pmt.year]) {
            acc[pmt.year] = {
              year: pmt.year,
              payments: 0,
              principal: 0,
              interest: 0,
              balance: pmt.balance,
              periodLabel: pmt.periodLabel,
            };
          }
          acc[pmt.year].payments += pmt.payment;
          acc[pmt.year].principal += pmt.principal;
          acc[pmt.year].interest += pmt.interest;
          acc[pmt.year].balance = pmt.balance;
          acc[pmt.year].periodLabel = pmt.periodLabel;
          return acc;
        }, {})
      )
    : [];

  // Track period transitions for visual separation
  let prevPeriodLabel = '';

  return (
    <Card title="Mortgage Amortization" subtitle="Payment breakdown over the loan term">
      <div className="px-4 py-2 border-b border-gray-100 flex items-center gap-2">
        <button
          onClick={() => setShowMonthly(false)}
          className={`px-3 py-1 text-xs rounded-md ${
            !showMonthly ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Annual
        </button>
        <button
          onClick={() => setShowMonthly(true)}
          className={`px-3 py-1 text-xs rounded-md ${
            showMonthly ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Monthly (first 10yr)
        </button>
      </div>
      <div className="overflow-x-auto max-h-96">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-white">
            <tr className="border-b border-gray-100">
              <th className="px-3 py-2.5 text-left font-semibold text-gray-600">
                {showMonthly ? 'Month' : 'Year'}
              </th>
              <th className="px-3 py-2.5 text-left font-semibold text-gray-600">Period</th>
              <th className="px-3 py-2.5 text-right font-semibold text-gray-600">Payment</th>
              <th className="px-3 py-2.5 text-right font-semibold text-gray-600">Principal</th>
              <th className="px-3 py-2.5 text-right font-semibold text-gray-600">Interest</th>
              <th className="px-3 py-2.5 text-right font-semibold text-gray-600">Balance</th>
            </tr>
          </thead>
          <tbody>
            {showMonthly
              ? schedule.slice(0, 120).map((pmt) => {
                  const isNewPeriod = pmt.periodLabel !== prevPeriodLabel;
                  prevPeriodLabel = pmt.periodLabel;
                  return (
                    <tr
                      key={pmt.month}
                      className={`border-b border-gray-50 hover:bg-gray-50 ${
                        isNewPeriod ? 'border-t-2 border-t-indigo-200' : ''
                      }`}
                    >
                      <td className="px-3 py-1.5 text-gray-700">
                        {pmt.year}-{String(((pmt.month - 1) % 12) + 1).padStart(2, '0')}
                      </td>
                      <td className="px-3 py-1.5 text-gray-500">
                        {isNewPeriod ? pmt.periodLabel : ''}
                      </td>
                      <td className="px-3 py-1.5 text-right text-gray-700">
                        {formatCurrencyDetailed(pmt.payment)}
                      </td>
                      <td className="px-3 py-1.5 text-right text-green-700">
                        {formatCurrencyDetailed(pmt.principal)}
                      </td>
                      <td className="px-3 py-1.5 text-right text-red-700">
                        {formatCurrencyDetailed(pmt.interest)}
                      </td>
                      <td className="px-3 py-1.5 text-right text-gray-700">
                        {formatCurrencyDetailed(pmt.balance)}
                      </td>
                    </tr>
                  );
                })
              : (() => {
                  prevPeriodLabel = '';
                  return annualData.map((row) => {
                    const isNewPeriod = row.periodLabel !== prevPeriodLabel;
                    prevPeriodLabel = row.periodLabel;
                    return (
                      <tr
                        key={row.year}
                        className={`border-b border-gray-50 hover:bg-gray-50 ${
                          isNewPeriod ? 'border-t-2 border-t-indigo-200' : ''
                        }`}
                      >
                        <td className="px-3 py-1.5 text-gray-700">{row.year}</td>
                        <td className="px-3 py-1.5 text-gray-500">
                          {isNewPeriod ? row.periodLabel : ''}
                        </td>
                        <td className="px-3 py-1.5 text-right text-gray-700">
                          {formatCurrencyDetailed(row.payments)}
                        </td>
                        <td className="px-3 py-1.5 text-right text-green-700">
                          {formatCurrencyDetailed(row.principal)}
                        </td>
                        <td className="px-3 py-1.5 text-right text-red-700">
                          {formatCurrencyDetailed(row.interest)}
                        </td>
                        <td className="px-3 py-1.5 text-right text-gray-700">
                          {formatCurrencyDetailed(row.balance)}
                        </td>
                      </tr>
                    );
                  });
                })()}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
