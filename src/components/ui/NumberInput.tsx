import { cn } from '../../utils/formatters';

interface NumberInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  prefix?: string;
  suffix?: string;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
  disabled?: boolean;
}

export function NumberInput({
  label,
  value,
  onChange,
  prefix,
  suffix,
  min,
  max,
  step = 1,
  className,
  disabled,
}: NumberInputProps) {
  return (
    <div className={cn('space-y-1', className)}>
      <label className="block text-xs font-medium text-gray-600">{label}</label>
      <div className="relative">
        {prefix && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
            {prefix}
          </span>
        )}
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          className={cn(
            'w-full rounded-md border border-gray-300 py-1.5 text-sm text-gray-900',
            'focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500',
            'disabled:bg-gray-50 disabled:text-gray-500',
            prefix ? 'pl-7 pr-3' : 'px-3',
            suffix ? 'pr-10' : ''
          )}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}
