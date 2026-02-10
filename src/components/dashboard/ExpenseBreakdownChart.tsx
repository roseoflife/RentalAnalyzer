import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { AnnualSummary, ExpenseCategory } from '../../types';
import { EXPENSE_CATEGORY_LABELS } from '../../types';
import { Card } from '../ui/Card';
import { formatCurrency } from '../../utils/formatters';
import { CHART_COLORS } from '../../constants/defaults';

interface ExpenseBreakdownChartProps {
  summaries: AnnualSummary[];
}

const COLORS_LIST: Record<ExpenseCategory, string> = CHART_COLORS as Record<ExpenseCategory, string>;

export function ExpenseBreakdownChart({ summaries }: ExpenseBreakdownChartProps) {
  // Aggregate all expense categories across all years
  const totals: Record<string, number> = {};

  summaries.forEach((s) => {
    Object.entries(s.expenseBreakdown).forEach(([cat, amount]) => {
      totals[cat] = (totals[cat] || 0) + amount;
    });
  });

  const data = Object.entries(totals)
    .filter(([, amount]) => amount > 0)
    .map(([category, amount]) => ({
      name: EXPENSE_CATEGORY_LABELS[category as ExpenseCategory] || category,
      value: Math.round(amount),
      category: category as ExpenseCategory,
    }))
    .sort((a, b) => b.value - a.value);

  return (
    <Card title="Expense Breakdown" subtitle="Total expenses by category">
      <div className="p-4 h-80">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((entry) => (
                <Cell
                  key={entry.category}
                  fill={COLORS_LIST[entry.category] || '#a855f7'}
                />
              ))}
            </Pie>
            <Tooltip formatter={(value: any) => formatCurrency(Number(value) || 0)} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
