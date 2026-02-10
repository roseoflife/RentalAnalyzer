import { SlidersHorizontal } from 'lucide-react';
import { NumberInput } from '../ui/NumberInput';
import { useAppContext } from '../../context/AppContext';

export function AssumptionsForm() {
  const { state, dispatch } = useAppContext();
  const { assumptions } = state.config;

  const update = (payload: Partial<typeof assumptions>) => {
    dispatch({ type: 'SET_ASSUMPTIONS', payload });
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <SlidersHorizontal size={14} className="text-indigo-600" />
        <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider">Assumptions</h3>
      </div>
      <div className="space-y-2">
        <NumberInput
          label="Appreciation Rate"
          value={assumptions.appreciationRate}
          onChange={(v) => update({ appreciationRate: v })}
          suffix="%"
          min={-10}
          max={20}
          step={0.5}
        />
        <NumberInput
          label="S&P 500 Return"
          value={assumptions.spReturn}
          onChange={(v) => update({ spReturn: v })}
          suffix="%"
          min={0}
          max={20}
          step={0.5}
        />
        <NumberInput
          label="Inflation Rate"
          value={assumptions.inflationRate}
          onChange={(v) => update({ inflationRate: v })}
          suffix="%"
          min={0}
          max={15}
          step={0.5}
        />
        <NumberInput
          label="Discount Rate"
          value={assumptions.discountRate}
          onChange={(v) => update({ discountRate: v })}
          suffix="%"
          min={0}
          max={20}
          step={0.5}
        />
        <NumberInput
          label="Tax Rate"
          value={assumptions.taxRate}
          onChange={(v) => update({ taxRate: v })}
          suffix="%"
          min={0}
          max={50}
          step={1}
        />
        <NumberInput
          label="Selling Costs"
          value={assumptions.sellingCosts}
          onChange={(v) => update({ sellingCosts: v })}
          suffix="%"
          min={0}
          max={15}
          step={0.5}
        />
        <NumberInput
          label="Capital Gains Tax"
          value={assumptions.capitalGainsTax}
          onChange={(v) => update({ capitalGainsTax: v })}
          suffix="%"
          min={0}
          max={30}
          step={1}
        />
      </div>
    </div>
  );
}
