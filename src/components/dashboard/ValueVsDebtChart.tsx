import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { useMemo } from 'react';
import type { AppConfig } from '../../types';
import { Card } from '../ui/Card';
import { formatCurrency } from '../../utils/formatters';
import { getMultiMortgageBalanceAtMonth } from '../../utils/mortgage';

interface ValueVsDebtChartProps {
  config: AppConfig;
  projectionYears?: number;
}

export function ValueVsDebtChart({ config, projectionYears = 25 }: ValueVsDebtChartProps) {
  const data = useMemo(() => {
    const mortgages = config.mortgages;
    const startYear = mortgages.length > 0
      ? Math.min(...mortgages.map((m) => m.startYear))
      : config.mortgage.startYear;
    const currentYear = new Date().getFullYear();

    const points: {
      year: number;
      propertyValue: number;
      loanBalance: number;
      equity: number;
    }[] = [];

    const endYear = currentYear + projectionYears;

    for (let year = startYear; year <= endYear; year++) {
      const yearsSincePurchase = year - startYear + 1;
      const propertyValue = config.property.purchasePrice *
        Math.pow(1 + config.assumptions.appreciationRate / 100, yearsSincePurchase);
      const loanBalance = getMultiMortgageBalanceAtMonth(mortgages, year, 12, config.extraMonthlyPayment ?? 0);
      const equity = propertyValue - loanBalance;

      points.push({
        year,
        propertyValue: Math.round(propertyValue),
        loanBalance: Math.round(loanBalance),
        equity: Math.round(equity),
      });
    }

    return points;
  }, [config, projectionYears]);

  const currentYear = new Date().getFullYear();

  return (
    <Card
      title="Property Value vs Mortgage Balance"
      subtitle={`${data[0]?.year}–${data[data.length - 1]?.year} projection (${projectionYears}yr)`}
    >
      <div className="p-4 h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="year" fontSize={12} />
            <YAxis fontSize={12} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
            <Tooltip
              formatter={(value: any) => formatCurrency(Number(value) || 0)}
              labelFormatter={(label) => `Year ${label}`}
            />
            <Legend />
            <ReferenceLine
              x={currentYear}
              stroke="#6366f1"
              strokeDasharray="4 4"
              label={{ value: 'Today', position: 'top', fontSize: 11, fill: '#6366f1' }}
            />
            <Area
              type="monotone"
              dataKey="propertyValue"
              name="Property Value"
              fill="#22c55e"
              stroke="#16a34a"
              fillOpacity={0.15}
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="loanBalance"
              name="Mortgage Balance"
              fill="#ef4444"
              stroke="#dc2626"
              fillOpacity={0.15}
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="equity"
              name="Equity"
              fill="#3b82f6"
              stroke="#2563eb"
              fillOpacity={0.1}
              strokeWidth={2}
              strokeDasharray="5 3"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
