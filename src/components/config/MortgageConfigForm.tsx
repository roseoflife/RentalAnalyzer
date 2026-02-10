import { Landmark, Plus, X } from 'lucide-react';
import { NumberInput } from '../ui/NumberInput';
import { useAppContext } from '../../context/AppContext';
import { formatCurrency } from '../../utils/formatters';
import type { MortgagePeriod } from '../../types';
import { calculateMonthlyPayment } from '../../utils/mortgage';

export function MortgageConfigForm() {
  const { state, dispatch } = useAppContext();
  const { mortgages } = state.config;

  const updatePeriod = (index: number, payload: Partial<MortgagePeriod>) => {
    dispatch({ type: 'SET_MORTGAGE_PERIOD', index, payload });
  };

  const addRefinance = () => {
    const last = mortgages[mortgages.length - 1];
    const newPeriod: MortgagePeriod = {
      label: `Refi ${new Date().getFullYear()}`,
      loanAmount: last.loanAmount,
      interestRate: last.interestRate,
      termYears: 30,
      monthlyPayment: 0,
      startYear: new Date().getFullYear(),
    };
    newPeriod.monthlyPayment = Math.round(
      calculateMonthlyPayment(newPeriod.loanAmount, newPeriod.interestRate, newPeriod.termYears) * 100
    ) / 100;
    dispatch({ type: 'ADD_MORTGAGE_PERIOD', payload: newPeriod });
  };

  const removePeriod = (index: number) => {
    dispatch({ type: 'REMOVE_MORTGAGE_PERIOD', index });
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Landmark size={14} className="text-indigo-600" />
        <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider">Mortgage</h3>
      </div>
      <div className="space-y-3">
        {mortgages.map((period, idx) => (
          <div
            key={idx}
            className="border border-gray-200 rounded-lg p-3 space-y-2 bg-gray-50/50"
          >
            <div className="flex items-center justify-between">
              <input
                type="text"
                value={period.label}
                onChange={(e) => updatePeriod(idx, { label: e.target.value })}
                className="text-xs font-semibold text-gray-700 bg-transparent border-none p-0 focus:outline-none focus:ring-0 w-full"
              />
              {idx > 0 && (
                <button
                  onClick={() => removePeriod(idx)}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                  title="Remove this period"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600">Loan Amount</label>
              {idx === 0 ? (
                <p className="text-sm font-medium text-gray-900 py-1.5">
                  {formatCurrency(period.loanAmount)}
                </p>
              ) : (
                <NumberInput
                  label=""
                  value={period.loanAmount}
                  onChange={(v) => updatePeriod(idx, { loanAmount: v })}
                  prefix="$"
                  min={0}
                  step={1000}
                />
              )}
            </div>
            <NumberInput
              label="Interest Rate"
              value={period.interestRate}
              onChange={(v) => updatePeriod(idx, { interestRate: v })}
              suffix="%"
              min={0}
              max={20}
              step={0.125}
            />
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Term</label>
              <div className="flex gap-1">
                {([15, 20, 25, 30] as const).map((term) => (
                  <button
                    key={term}
                    onClick={() => updatePeriod(idx, { termYears: term })}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-md border transition-colors ${
                      period.termYears === term
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {term}yr
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600">Monthly Payment</label>
              <p className="text-sm font-medium text-gray-900 py-1.5">
                {formatCurrency(period.monthlyPayment)}
              </p>
            </div>
            <NumberInput
              label="Start Year"
              value={period.startYear}
              onChange={(v) => updatePeriod(idx, { startYear: v })}
              min={1990}
              max={2050}
              step={1}
            />
          </div>
        ))}
        <button
          onClick={addRefinance}
          className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-indigo-600 border border-dashed border-indigo-300 rounded-lg hover:bg-indigo-50 transition-colors"
        >
          <Plus size={14} />
          Add Refinance
        </button>
      </div>
    </div>
  );
}
