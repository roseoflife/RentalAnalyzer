import { Home } from 'lucide-react';
import { NumberInput } from '../ui/NumberInput';
import { useAppContext } from '../../context/AppContext';
import { formatCurrency } from '../../utils/formatters';

export function PropertyConfigForm() {
  const { state, dispatch } = useAppContext();
  const { property } = state.config;

  const update = (payload: Partial<typeof property>) => {
    dispatch({ type: 'SET_PROPERTY_CONFIG', payload });
  };

  const downPayment = property.purchasePrice * (property.downPaymentPercent / 100);

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Home size={14} className="text-indigo-600" />
        <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wider">Property</h3>
      </div>
      <div className="space-y-2">
        <NumberInput
          label="Purchase Price"
          value={property.purchasePrice}
          onChange={(v) => update({ purchasePrice: v })}
          prefix="$"
          step={5000}
        />
        <NumberInput
          label="Down Payment"
          value={property.downPaymentPercent}
          onChange={(v) => update({ downPaymentPercent: v })}
          suffix="%"
          min={0}
          max={100}
          step={1}
        />
        <p className="text-xs text-gray-400 pl-1">{formatCurrency(downPayment)}</p>
        <NumberInput
          label="Closing Costs"
          value={property.closingCosts}
          onChange={(v) => update({ closingCosts: v })}
          prefix="$"
          step={500}
        />
        <NumberInput
          label="Current Value"
          value={property.currentValue}
          onChange={(v) => update({ currentValue: v })}
          prefix="$"
          step={5000}
        />
      </div>
    </div>
  );
}
