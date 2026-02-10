import { useState } from 'react';
import type { AnnualSummary } from '../../types';
import { Card } from '../ui/Card';
import { formatCurrency, formatPercent } from '../../utils/formatters';

interface AnnualSummaryTableProps {
  summaries: AnnualSummary[];
}

type SortKey = keyof AnnualSummary;
type SortDir = 'asc' | 'desc';

const columns: { key: SortKey; label: string; format: (v: number) => string }[] = [
  { key: 'year', label: 'Year', format: (v) => String(v) },
  { key: 'effectiveGrossIncome', label: 'EGI', format: formatCurrency },
  { key: 'operatingExpenses', label: 'Op. Expenses', format: formatCurrency },
  { key: 'noi', label: 'NOI', format: formatCurrency },
  { key: 'mortgagePayments', label: 'Mortgage', format: formatCurrency },
  { key: 'netCashFlow', label: 'Net Cash Flow', format: formatCurrency },
  { key: 'capRate', label: 'Cap Rate', format: formatPercent },
  { key: 'cashOnCash', label: 'CoC', format: formatPercent },
  { key: 'propertyValue', label: 'Prop. Value', format: formatCurrency },
  { key: 'equity', label: 'Equity', format: formatCurrency },
  { key: 'totalROI', label: 'ROI', format: formatPercent },
];

export function AnnualSummaryTable({ summaries }: AnnualSummaryTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('year');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sorted = [...summaries].sort((a, b) => {
    const aVal = a[sortKey] as number;
    const bVal = b[sortKey] as number;
    return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
  });

  return (
    <Card title="Annual Summary" subtitle="Year-by-year financial breakdown (click headers to sort)">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-100">
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className="px-3 py-2.5 text-left font-semibold text-gray-600 cursor-pointer hover:text-gray-900 whitespace-nowrap"
                >
                  {col.label}
                  {sortKey === col.key && (
                    <span className="ml-1">{sortDir === 'asc' ? '\u2191' : '\u2193'}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => (
              <tr key={row.year} className="border-b border-gray-50 hover:bg-gray-50">
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`px-3 py-2 whitespace-nowrap ${
                      col.key === 'netCashFlow' || col.key === 'noi'
                        ? (row[col.key] as number) >= 0
                          ? 'text-green-700 font-medium'
                          : 'text-red-700 font-medium'
                        : 'text-gray-700'
                    }`}
                  >
                    {col.format(row[col.key] as number)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
