export interface OverallMetrics {
  totalNOI: number;
  avgCapRate: number;
  avgCashOnCash: number;
  totalNetCashFlow: number;
  totalROI: number;
  annualizedROI: number;
  currentEquity: number;
  totalAppreciation: number;
  totalPrincipalPaid: number;
  totalTaxBenefits: number;
  spComparison: number;
  propertyTotalWealth: number;
}

export interface RecommendationResult {
  score: number;
  verdict: 'Strong Keep' | 'Keep' | 'Neutral' | 'Sell' | 'Strong Sell';
  reasons: RecommendationReason[];
  factors: RecommendationFactor[];
}

export interface RecommendationReason {
  text: string;
  positive: boolean;
}

export interface RecommendationFactor {
  name: string;
  weight: number;
  score: number;
  weightedScore: number;
  description: string;
}
