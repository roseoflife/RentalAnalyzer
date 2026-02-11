import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { useMemo } from 'react';
import type { AppConfig, IncomeRecord } from '../../types';
import { Card } from '../ui/Card';
import { formatCurrency } from '../../utils/formatters';

interface RentGrowthChartProps {
  config: AppConfig;
  income: IncomeRecord[];
  projectionYears?: number;
}

export function RentGrowthChart({ config, income, projectionYears = 25 }: RentGrowthChartProps) {
  const data = useMemo(() => {
    if (income.length === 0) return [];

    // Get the last year's annual rental income as base
    const years = [...new Set(income.map((r) => r.year))].sort((a, b) => a - b);
    const lastDataYear = years[years.length - 1];
    const lastYearIncome = income.filter((r) => r.year === lastDataYear);
    const baseAnnualRent = lastYearIncome.reduce((s, r) => s + r.rentalIncome, 0);

    const rentGrowth = config.assumptions.rentGrowthRate / 100;

    const points: { year: number; annualRent: number }[] = [];

    // Show actual years from data
    for (const year of years) {
      const yearIncome = income.filter((r) => r.year === year);
      const annualRent = yearIncome.reduce((s, r) => s + r.rentalIncome, 0);
      points.push({ year, annualRent: Math.round(annualRent) });
    }

    // Project forward
    for (let i = 1; i <= projectionYears; i++) {
      const year = lastDataYear + i;
      const annualRent = baseAnnualRent * Math.pow(1 + rentGrowth, i);
      points.push({ year, annualRent: Math.round(annualRent) });
    }

    return points;
  }, [config, income, projectionYears]);

  if (data.length === 0) return null;

  const currentYear = new Date().getFullYear();

  return (
    <Card
      title="Projected Rental Income"
      subtitle={`${config.assumptions.rentGrowthRate}% annual rent growth`}
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
            <ReferenceLine
              x={currentYear}
              stroke="#6366f1"
              strokeDasharray="4 4"
              label={{ value: 'Today', position: 'top', fontSize: 11, fill: '#6366f1' }}
            />
            <Area
              type="monotone"
              dataKey="annualRent"
              name="Annual Rental Income"
              fill="#22c55e"
              stroke="#16a34a"
              fillOpacity={0.2}
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
