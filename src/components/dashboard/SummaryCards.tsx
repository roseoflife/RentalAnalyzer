import {
  DollarSign,
  TrendingUp,
  Percent,
  BarChart3,
  PiggyBank,
  Scale,
  Building,
} from 'lucide-react';
import type { OverallMetrics, RecommendationResult } from '../../types';
import { formatCurrency, formatPercent } from '../../utils/formatters';

interface SummaryCardsProps {
  metrics: OverallMetrics;
  recommendation: RecommendationResult;
}

function getVerdictColor(verdict: RecommendationResult['verdict']): string {
  switch (verdict) {
    case 'Strong Keep':
      return 'bg-green-100 text-green-800';
    case 'Keep':
      return 'bg-emerald-100 text-emerald-800';
    case 'Neutral':
      return 'bg-yellow-100 text-yellow-800';
    case 'Sell':
      return 'bg-orange-100 text-orange-800';
    case 'Strong Sell':
      return 'bg-red-100 text-red-800';
  }
}

interface CardData {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
}

export function SummaryCards({ metrics, recommendation }: SummaryCardsProps) {
  const cards: CardData[] = [
    {
      label: 'Total NOI',
      value: formatCurrency(metrics.totalNOI),
      icon: <DollarSign size={18} />,
      color: 'text-green-600 bg-green-50',
    },
    {
      label: 'Avg Cap Rate',
      value: formatPercent(metrics.avgCapRate),
      icon: <Percent size={18} />,
      color: 'text-blue-600 bg-blue-50',
    },
    {
      label: 'Avg Cash-on-Cash',
      value: formatPercent(metrics.avgCashOnCash),
      icon: <BarChart3 size={18} />,
      color: 'text-purple-600 bg-purple-50',
    },
    {
      label: 'Total Net Cash Flow',
      value: formatCurrency(metrics.totalNetCashFlow),
      icon: <TrendingUp size={18} />,
      color: metrics.totalNetCashFlow >= 0
        ? 'text-green-600 bg-green-50'
        : 'text-red-600 bg-red-50',
    },
    {
      label: 'Total ROI',
      value: formatPercent(metrics.totalROI),
      icon: <TrendingUp size={18} />,
      color: 'text-indigo-600 bg-indigo-50',
    },
    {
      label: 'Property vs S&P 500',
      value: formatCurrency(metrics.propertyTotalWealth - metrics.spComparison),
      icon: <Scale size={18} />,
      color: metrics.propertyTotalWealth >= metrics.spComparison
        ? 'text-green-600 bg-green-50'
        : 'text-red-600 bg-red-50',
    },
    {
      label: 'Current Equity',
      value: formatCurrency(metrics.currentEquity),
      icon: <Building size={18} />,
      color: 'text-cyan-600 bg-cyan-50',
    },
    {
      label: 'Annualized ROI',
      value: formatPercent(metrics.annualizedROI),
      icon: <PiggyBank size={18} />,
      color: 'text-amber-600 bg-amber-50',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-500">{card.label}</span>
            <span className={`p-1.5 rounded-lg ${card.color}`}>{card.icon}</span>
          </div>
          <p className="text-xl font-bold text-gray-900">{card.value}</p>
        </div>
      ))}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm col-span-2 lg:col-span-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-gray-500">Recommendation</span>
            <div className="flex items-center gap-3 mt-1">
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${getVerdictColor(
                  recommendation.verdict
                )}`}
              >
                {recommendation.verdict}
              </span>
              <span className="text-sm text-gray-500">
                Score: {recommendation.score}/100
              </span>
            </div>
          </div>
          <div className="w-24 h-24 relative">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="8"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke={recommendation.score >= 20 ? '#22c55e' : recommendation.score >= -20 ? '#eab308' : '#ef4444'}
                strokeWidth="8"
                strokeDasharray={`${((recommendation.score + 100) / 200) * 251.3} 251.3`}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-gray-900">
              {recommendation.score}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
