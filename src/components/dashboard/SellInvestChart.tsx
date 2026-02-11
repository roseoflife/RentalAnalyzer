import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { useMemo } from 'react';
import type { AppConfig, AnnualSummary } from '../../types';
import { Card } from '../ui/Card';
import { formatCurrency } from '../../utils/formatters';
import { getMultiMortgageBalanceAtMonth } from '../../utils/mortgage';

interface SellInvestChartProps {
  config: AppConfig;
  summaries: AnnualSummary[];
  projectionYears?: number;
}

export function SellInvestChart({ config, summaries, projectionYears = 25 }: SellInvestChartProps) {
  const data = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const startYear = config.mortgages.length > 0
      ? Math.min(...config.mortgages.map((m) => m.startYear))
      : config.mortgage.startYear;
    const endYear = currentYear + projectionYears;
    const extra = config.extraMonthlyPayment ?? 0;

    const points: {
      year: number;
      holdWealth: number;
      sellInvest: number;
    }[] = [];

    // Accumulate cash flow from summaries
    const cashFlowByYear = new Map<number, number>();
    for (const s of summaries) {
      cashFlowByYear.set(s.year, s.netCashFlow);
    }

    let cumulativeCashFlow = 0;

    for (let year = currentYear; year <= endYear; year++) {
      const yearsSincePurchase = year - startYear + 1;
      const propertyValue = config.property.purchasePrice *
        Math.pow(1 + config.assumptions.appreciationRate / 100, yearsSincePurchase);
      const loanBalance = getMultiMortgageBalanceAtMonth(config.mortgages, year, 12, extra);
      const equity = propertyValue - loanBalance;

      // Accumulate cash flow
      cumulativeCashFlow += cashFlowByYear.get(year) ?? 0;

      // Hold wealth = equity + cumulative cash flow
      const holdWealth = equity + cumulativeCashFlow;

      // Sell scenario: sell today, pay costs and taxes, invest in S&P
      const sellingCostsPct = config.assumptions.sellingCosts / 100;
      const capitalGainsTaxPct = config.assumptions.capitalGainsTax / 100;

      // If we sold at the START (currentYear), what are the proceeds?
      const sellYearValue = config.property.purchasePrice *
        Math.pow(1 + config.assumptions.appreciationRate / 100, currentYear - startYear + 1);
      const sellLoanBalance = getMultiMortgageBalanceAtMonth(config.mortgages, currentYear, 12, extra);
      const grossProceeds = sellYearValue - sellLoanBalance;
      const sellingCosts = sellYearValue * sellingCostsPct;
      const capitalGain = Math.max(0, sellYearValue - config.property.purchasePrice);
      const capitalGainsTax = capitalGain * capitalGainsTaxPct;
      const netProceeds = Math.max(0, grossProceeds - sellingCosts - capitalGainsTax);

      // Invest net proceeds in S&P for (year - currentYear) years
      const yearsInvested = year - currentYear;
      const spGrowth = Math.pow(1 + config.assumptions.spReturn / 100, yearsInvested);
      const sellInvest = netProceeds * spGrowth;

      points.push({
        year,
        holdWealth: Math.round(holdWealth),
        sellInvest: Math.round(sellInvest),
      });
    }

    return points;
  }, [config, summaries, projectionYears]);

  const currentYear = new Date().getFullYear();

  return (
    <Card
      title="Hold vs Sell & Invest in S&P 500"
      subtitle={`Compare keeping property vs selling now and investing proceeds`}
    >
      <div className="p-4 h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
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
            <Line
              type="monotone"
              dataKey="holdWealth"
              name="Hold Property"
              stroke="#22c55e"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="sellInvest"
              name="Sell & Invest (S&P 500)"
              stroke="#f59e0b"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
