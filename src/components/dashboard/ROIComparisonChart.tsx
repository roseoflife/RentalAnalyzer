import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { AnnualSummary, AppConfig } from '../../types';
import { Card } from '../ui/Card';
import { formatCurrency } from '../../utils/formatters';
import { calculateWealthComparison } from '../../utils/opportunity-cost';
import { CHART_COLORS } from '../../constants/defaults';

interface ROIComparisonChartProps {
  summaries: AnnualSummary[];
  config: AppConfig;
}

export function ROIComparisonChart({ summaries, config }: ROIComparisonChartProps) {
  const data = calculateWealthComparison(summaries, config);

  return (
    <Card title="ROI Comparison" subtitle="Property total wealth vs S&P 500 alternative">
      <div className="p-4 h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="year" fontSize={12} />
            <YAxis fontSize={12} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
            <Tooltip formatter={(value: any) => formatCurrency(Number(value) || 0)} />
            <Legend />
            <Line
              type="monotone"
              dataKey="propertyWealth"
              name="Property"
              stroke={CHART_COLORS.property}
              strokeWidth={2}
              dot={{ fill: CHART_COLORS.property, r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="spWealth"
              name="S&P 500"
              stroke={CHART_COLORS.sp500}
              strokeWidth={2}
              dot={{ fill: CHART_COLORS.sp500, r: 4 }}
              strokeDasharray="5 5"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
