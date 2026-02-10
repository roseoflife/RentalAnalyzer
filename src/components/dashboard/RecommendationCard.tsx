import { ThumbsUp, ThumbsDown } from 'lucide-react';
import type { RecommendationResult } from '../../types';
import { Card } from '../ui/Card';
import { cn } from '../../utils/formatters';

interface RecommendationCardProps {
  recommendation: RecommendationResult;
}

function getVerdictStyle(verdict: RecommendationResult['verdict']) {
  switch (verdict) {
    case 'Strong Keep':
      return { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-800', badge: 'bg-green-600' };
    case 'Keep':
      return { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-800', badge: 'bg-emerald-600' };
    case 'Neutral':
      return { bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-800', badge: 'bg-yellow-600' };
    case 'Sell':
      return { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-800', badge: 'bg-orange-600' };
    case 'Strong Sell':
      return { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800', badge: 'bg-red-600' };
  }
}

export function RecommendationCard({ recommendation }: RecommendationCardProps) {
  const style = getVerdictStyle(recommendation.verdict);

  return (
    <Card title="Recommendation Analysis" subtitle="Based on weighted scoring of key factors">
      <div className="p-5 space-y-5">
        <div className={cn('rounded-lg p-4 border', style.bg, style.border)}>
          <div className="flex items-center gap-3">
            <span className={cn('px-3 py-1.5 rounded-lg text-white font-bold text-sm', style.badge)}>
              {recommendation.verdict}
            </span>
            <span className={cn('text-sm font-medium', style.text)}>
              Score: {recommendation.score} / 100
            </span>
          </div>
        </div>

        {/* Factors breakdown */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-gray-900">Factor Analysis</h4>
          {recommendation.factors.map((factor) => (
            <div key={factor.name} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-gray-700">
                  {factor.name} ({Math.round(factor.weight * 100)}%)
                </span>
                <span
                  className={cn(
                    'font-bold',
                    factor.score > 0 ? 'text-green-600' : factor.score < 0 ? 'text-red-600' : 'text-gray-500'
                  )}
                >
                  {factor.score > 0 ? '+' : ''}{Math.round(factor.score)}
                </span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2">
                <div
                  className={cn(
                    'h-2 rounded-full transition-all',
                    factor.score > 0 ? 'bg-green-500' : factor.score < 0 ? 'bg-red-500' : 'bg-gray-400'
                  )}
                  style={{
                    width: `${Math.abs(factor.score) / 2}%`,
                    marginLeft: factor.score < 0 ? `${50 - Math.abs(factor.score) / 2}%` : '50%',
                  }}
                />
              </div>
              <p className="text-xs text-gray-500">{factor.description}</p>
            </div>
          ))}
        </div>

        {/* Key insights */}
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-gray-900">Key Insights</h4>
          {recommendation.reasons.map((reason, i) => (
            <div key={i} className="flex items-start gap-2 text-xs">
              {reason.positive ? (
                <ThumbsUp size={14} className="text-green-500 mt-0.5 flex-shrink-0" />
              ) : (
                <ThumbsDown size={14} className="text-red-500 mt-0.5 flex-shrink-0" />
              )}
              <span className="text-gray-700">{reason.text}</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
