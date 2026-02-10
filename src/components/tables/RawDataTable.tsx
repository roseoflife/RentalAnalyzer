import { useState } from 'react';
import type { IncomeRecord, ExpenseRecord } from '../../types';
import { EXPENSE_CATEGORY_LABELS } from '../../types';
import { Card } from '../ui/Card';
import { formatCurrency } from '../../utils/formatters';

interface RawDataTableProps {
  income: IncomeRecord[];
  expenses: ExpenseRecord[];
}

export function RawDataTable({ income, expenses }: RawDataTableProps) {
  const [view, setView] = useState<'income' | 'expenses'>('income');

  return (
    <Card title="Raw Data" subtitle="Uploaded data viewer">
      <div className="px-4 py-2 border-b border-gray-100 flex items-center gap-2">
        <button
          onClick={() => setView('income')}
          className={`px-3 py-1 text-xs rounded-md ${
            view === 'income' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Income ({income.length})
        </button>
        <button
          onClick={() => setView('expenses')}
          className={`px-3 py-1 text-xs rounded-md ${
            view === 'expenses' ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          Expenses ({expenses.length})
        </button>
      </div>
      <div className="overflow-x-auto max-h-96">
        {view === 'income' ? (
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-white">
              <tr className="border-b border-gray-100">
                <th className="px-3 py-2.5 text-left font-semibold text-gray-600">Year</th>
                <th className="px-3 py-2.5 text-left font-semibold text-gray-600">Month</th>
                <th className="px-3 py-2.5 text-right font-semibold text-gray-600">Rental Income</th>
                <th className="px-3 py-2.5 text-right font-semibold text-gray-600">Other Income</th>
                <th className="px-3 py-2.5 text-right font-semibold text-gray-600">Vacancy Loss</th>
              </tr>
            </thead>
            <tbody>
              {income.map((r, i) => (
                <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-3 py-1.5 text-gray-700">{r.year}</td>
                  <td className="px-3 py-1.5 text-gray-700">{r.month}</td>
                  <td className="px-3 py-1.5 text-right text-green-700">{formatCurrency(r.rentalIncome)}</td>
                  <td className="px-3 py-1.5 text-right text-gray-700">{formatCurrency(r.otherIncome)}</td>
                  <td className="px-3 py-1.5 text-right text-red-700">{formatCurrency(r.vacancyLoss)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-white">
              <tr className="border-b border-gray-100">
                <th className="px-3 py-2.5 text-left font-semibold text-gray-600">Year</th>
                <th className="px-3 py-2.5 text-left font-semibold text-gray-600">Month</th>
                <th className="px-3 py-2.5 text-left font-semibold text-gray-600">Category</th>
                <th className="px-3 py-2.5 text-right font-semibold text-gray-600">Amount</th>
                <th className="px-3 py-2.5 text-left font-semibold text-gray-600">Description</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((r, i) => (
                <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-3 py-1.5 text-gray-700">{r.year}</td>
                  <td className="px-3 py-1.5 text-gray-700">{r.month}</td>
                  <td className="px-3 py-1.5 text-gray-700">{EXPENSE_CATEGORY_LABELS[r.category]}</td>
                  <td className="px-3 py-1.5 text-right text-red-700">{formatCurrency(r.amount)}</td>
                  <td className="px-3 py-1.5 text-gray-500 max-w-48 truncate">{r.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Card>
  );
}
