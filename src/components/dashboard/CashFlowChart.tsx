import {
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
} from 'recharts';
import type { AnnualSummary } from '../../types';
import { Card } from '../ui/Card';
import { formatCurrency } from '../../utils/formatters';
import { CHART_COLORS } from '../../constants/defaults';

interface CashFlowChartProps {
  summaries: AnnualSummary[];
}

export function CashFlowChart({ summaries }: CashFlowChartProps) {
  const data = summaries.map((s) => ({
    year: s.year,
    income: Math.round(s.effectiveGrossIncome),
    expenses: Math.round(s.totalExpenses),
    netCashFlow: Math.round(s.netCashFlow),
  }));

  return (
    <Card title="Cash Flow" subtitle="Annual income vs expenses with net cash flow">
      <div className="p-4 h-80">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="year" fontSize={12} />
            <YAxis fontSize={12} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
            <Tooltip
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(value: any, name: any) => [
                formatCurrency(Number(value) || 0),
                name === 'income'
                  ? 'Income'
                  : name === 'expenses'
                  ? 'Expenses'
                  : 'Net Cash Flow',
              ]}
            />
            <Legend />
            <Bar dataKey="income" name="Income" fill={CHART_COLORS.income} radius={[4, 4, 0, 0]} />
            <Bar dataKey="expenses" name="Expenses" fill={CHART_COLORS.expenses} radius={[4, 4, 0, 0]} />
            <Line
              type="monotone"
              dataKey="netCashFlow"
              name="Net Cash Flow"
              stroke={CHART_COLORS.netCashFlow}
              strokeWidth={2}
              dot={{ fill: CHART_COLORS.netCashFlow, r: 4 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
