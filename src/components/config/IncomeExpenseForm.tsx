import { useState } from 'react';
import { DollarSign, ChevronDown, ChevronRight } from 'lucide-react';
import { NumberInput } from '../ui/NumberInput';
import { useAppContext } from '../../context/AppContext';
import { EXPENSE_CATEGORY_LABELS, type ExpenseCategory } from '../../types';
import type { ManualFinancials } from '../../types';

const EXPENSE_KEYS: Exclude<ExpenseCategory, 'mortgage'>[] = [
  'property_tax',
  'insurance',
  'maintenance',
  'repairs',
  'management',
  'utilities',
  'hoa',
  'capex',
  'other',
];

export function IncomeExpenseForm() {
  const { state, dispatch } = useAppContext();
  const { manualFinancials } = state.config;
  const [showExpenses, setShowExpenses] = useState(false);

  const update = (payload: Partial<ManualFinancials>) => {
    dispatch({ type: 'SET_MANUAL_FINANCIALS', payload });
  };

  const updateExpense = (category: Exclude<ExpenseCategory, 'mortgage'>, value: number) => {
    update({
      annualExpenses: { ...manualFinancials.annualExpenses, [category]: value },
    });
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <DollarSign size={14} className="text-indigo-600" />
        <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider">
          Income & Expenses
        </h3>
      </div>
      <div className="space-y-2">
        <NumberInput
          label="Monthly Rent"
          value={manualFinancials.monthlyRent}
          onChange={(v) => update({ monthlyRent: v })}
          prefix="$"
          step={50}
          min={0}
        />
        <NumberInput
          label="Other Monthly Income"
          value={manualFinancials.otherMonthlyIncome}
          onChange={(v) => update({ otherMonthlyIncome: v })}
          prefix="$"
          step={50}
          min={0}
        />
        <NumberInput
          label="Vacancy Rate"
          value={manualFinancials.vacancyRate}
          onChange={(v) => update({ vacancyRate: v })}
          suffix="%"
          min={0}
          max={100}
          step={1}
        />

        <button
          type="button"
          onClick={() => setShowExpenses(!showExpenses)}
          className="flex items-center gap-1 text-xs font-medium text-gray-600 hover:text-gray-900 mt-2"
        >
          {showExpenses ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          Annual Expenses
        </button>

        {showExpenses && (
          <div className="space-y-2 pl-1">
            {EXPENSE_KEYS.map((cat) => (
              <NumberInput
                key={cat}
                label={EXPENSE_CATEGORY_LABELS[cat]}
                value={manualFinancials.annualExpenses[cat]}
                onChange={(v) => updateExpense(cat, v)}
                prefix="$"
                step={100}
                min={0}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
