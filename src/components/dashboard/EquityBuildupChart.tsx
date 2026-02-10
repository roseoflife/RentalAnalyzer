import {
  AreaChart,
  Area,
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
import { CHART_COLORS } from '../../constants/defaults';

interface EquityBuildupChartProps {
  summaries: AnnualSummary[];
  config: AppConfig;
}

export function EquityBuildupChart({ summaries, config }: EquityBuildupChartProps) {
  let cumulativePrincipal = 0;

  const data = summaries.map((s) => {
    cumulativePrincipal += s.principalPaid;
    const appreciation = s.propertyValue - config.property.purchasePrice;
    const downPayment = config.property.purchasePrice * (config.property.downPaymentPercent / 100);

    return {
      year: s.year,
      downPayment: Math.round(downPayment),
      principalPaydown: Math.round(cumulativePrincipal),
      appreciation: Math.round(Math.max(0, appreciation)),
    };
  });

  return (
    <Card title="Equity Buildup" subtitle="How your equity grows over time">
      <div className="p-4 h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="year" fontSize={12} />
            <YAxis fontSize={12} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
            <Tooltip formatter={(value: any) => formatCurrency(Number(value) || 0)} />
            <Legend />
            <Area
              type="monotone"
              dataKey="downPayment"
              name="Down Payment"
              stackId="1"
              fill="#94a3b8"
              stroke="#64748b"
              fillOpacity={0.6}
            />
            <Area
              type="monotone"
              dataKey="principalPaydown"
              name="Principal Paydown"
              stackId="1"
              fill={CHART_COLORS.principalPaydown}
              stroke={CHART_COLORS.principalPaydown}
              fillOpacity={0.6}
            />
            <Area
              type="monotone"
              dataKey="appreciation"
              name="Appreciation"
              stackId="1"
              fill={CHART_COLORS.appreciation}
              stroke={CHART_COLORS.appreciation}
              fillOpacity={0.6}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
