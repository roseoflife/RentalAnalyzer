import { useMemo } from 'react';
import { AppProvider, useAppContext } from './context/AppContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { PageContainer } from './components/layout/PageContainer';
import { FileUploader } from './components/upload/FileUploader';
import { SummaryCards } from './components/dashboard/SummaryCards';
import { CashFlowChart } from './components/dashboard/CashFlowChart';
import { ROIComparisonChart } from './components/dashboard/ROIComparisonChart';
import { EquityBuildupChart } from './components/dashboard/EquityBuildupChart';
import { ExpenseBreakdownChart } from './components/dashboard/ExpenseBreakdownChart';
import { RecommendationCard } from './components/dashboard/RecommendationCard';
import { ValueVsDebtChart } from './components/dashboard/ValueVsDebtChart';
import { SellInvestChart } from './components/dashboard/SellInvestChart';
import { RentGrowthChart } from './components/dashboard/RentGrowthChart';
import { AnnualSummaryTable } from './components/tables/AnnualSummaryTable';
import { MortgageScheduleTable } from './components/tables/MortgageScheduleTable';
import { RawDataTable } from './components/tables/RawDataTable';
import { useMetricsCalculator } from './hooks/useMetricsCalculator';
import { useMortgageAmortization } from './hooks/useMortgageAmortization';
import { useRecommendation } from './hooks/useRecommendation';
import { calculateOverallMetrics } from './utils/metrics';
import { generateProjectedData } from './utils/projections';
import type { AnnualSummary } from './types';
import { formatCurrency } from './utils/formatters';

const CUTOFF_YEAR = new Date().getFullYear();

function SetupTab() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-1">Setup</h2>
        <p className="text-sm text-gray-500">
          Upload your income and expense data to get started, or load sample data for a demo.
        </p>
      </div>
      <FileUploader />
    </div>
  );
}

function NoDataPlaceholder() {
  return (
    <div className="flex items-center justify-center h-96">
      <div className="text-center">
        <p className="text-lg font-medium text-gray-400 mb-2">No data loaded</p>
        <p className="text-sm text-gray-400">Go to Setup tab to upload your data</p>
      </div>
    </div>
  );
}

function YearOverYearCard({ summaries }: { summaries: AnnualSummary[] }) {
  if (summaries.length < 2) return null;

  const rows = summaries.slice(0, -1).map((prev, i) => {
    const curr = summaries[i + 1];
    return {
      from: prev.year,
      to: curr.year,
      income: curr.effectiveGrossIncome - prev.effectiveGrossIncome,
      expenses: curr.totalExpenses - prev.totalExpenses,
      noi: curr.noi - prev.noi,
      cashFlow: curr.netCashFlow - prev.netCashFlow,
    };
  });

  function changeCell(value: number) {
    const color = value >= 0 ? 'text-green-600' : 'text-red-600';
    const prefix = value >= 0 ? '+' : '';
    return <span className={color}>{prefix}{formatCurrency(value)}</span>;
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Year-over-Year Changes</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
              <th className="pb-2 pr-4">Period</th>
              <th className="pb-2 pr-4">Income</th>
              <th className="pb-2 pr-4">Expenses</th>
              <th className="pb-2 pr-4">NOI</th>
              <th className="pb-2">Cash Flow</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.from} className="border-b border-gray-50">
                <td className="py-2 pr-4 font-medium text-gray-700">{row.from} → {row.to}</td>
                <td className="py-2 pr-4">{changeCell(row.income)}</td>
                <td className="py-2 pr-4">{changeCell(-row.expenses)}</td>
                <td className="py-2 pr-4">{changeCell(row.noi)}</td>
                <td className="py-2">{changeCell(row.cashFlow)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PastTab() {
  const { state } = useAppContext();
  const { annualSummaries } = useMetricsCalculator(
    state.incomeData,
    state.expenseData,
    state.config
  );

  const pastSummaries = useMemo(
    () => annualSummaries.filter((s) => s.year < CUTOFF_YEAR),
    [annualSummaries]
  );

  const pastMetrics = useMemo(
    () => calculateOverallMetrics(pastSummaries, state.config),
    [pastSummaries, state.config]
  );

  const recommendation = useRecommendation(annualSummaries, state.config);

  if (!state.dataLoaded) return <NoDataPlaceholder />;

  if (pastSummaries.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-lg font-medium text-gray-400 mb-2">No historical data</p>
          <p className="text-sm text-gray-400">No data found before {CUTOFF_YEAR}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">Historical Performance</h2>
        <p className="text-sm text-gray-500">
          Analysis of {pastSummaries[0].year}–{pastSummaries[pastSummaries.length - 1].year} actuals
        </p>
      </div>
      <SummaryCards metrics={pastMetrics} recommendation={recommendation} />
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <CashFlowChart summaries={pastSummaries} />
        <ExpenseBreakdownChart summaries={pastSummaries} />
      </div>
      <YearOverYearCard summaries={pastSummaries} />
    </div>
  );
}

function FutureTab() {
  const { state } = useAppContext();

  // Generate projected data for 25 years beyond existing data
  const { projectedIncome, projectedExpenses } = useMemo(
    () => generateProjectedData(state.incomeData, state.expenseData, state.config, 25),
    [state.incomeData, state.expenseData, state.config]
  );

  // Merge existing + projected data
  const allIncome = useMemo(
    () => [...state.incomeData, ...projectedIncome],
    [state.incomeData, projectedIncome]
  );
  const allExpenses = useMemo(
    () => [...state.expenseData, ...projectedExpenses],
    [state.expenseData, projectedExpenses]
  );

  const { annualSummaries: allSummaries } = useMetricsCalculator(
    allIncome,
    allExpenses,
    state.config
  );

  const futureSummaries = useMemo(
    () => allSummaries.filter((s) => s.year >= CUTOFF_YEAR),
    [allSummaries]
  );

  const futureMetrics = useMemo(
    () => calculateOverallMetrics(futureSummaries, state.config),
    [futureSummaries, state.config]
  );

  const recommendation = useRecommendation(allSummaries, state.config);

  if (!state.dataLoaded) return <NoDataPlaceholder />;

  if (futureSummaries.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-lg font-medium text-gray-400 mb-2">No projected data</p>
          <p className="text-sm text-gray-400">No data found for {CUTOFF_YEAR} or later</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">Future Projections</h2>
        <p className="text-sm text-gray-500">
          {futureSummaries[0].year}–{futureSummaries[futureSummaries.length - 1].year} projections &amp; keep-vs-sell analysis
        </p>
      </div>
      <SummaryCards metrics={futureMetrics} recommendation={recommendation} />
      <ValueVsDebtChart config={state.config} projectionYears={25} />
      <SellInvestChart config={state.config} summaries={futureSummaries} projectionYears={25} />
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <CashFlowChart summaries={futureSummaries} />
        <RentGrowthChart config={state.config} income={allIncome} projectionYears={25} />
        <ROIComparisonChart summaries={allSummaries} config={state.config} />
        <EquityBuildupChart summaries={allSummaries} config={state.config} />
      </div>
      <RecommendationCard recommendation={recommendation} />
    </div>
  );
}

function DataTab() {
  const { state } = useAppContext();
  const { annualSummaries } = useMetricsCalculator(
    state.incomeData,
    state.expenseData,
    state.config
  );
  const schedule = useMortgageAmortization(state.config.mortgages, state.config.extraMonthlyPayment);

  if (!state.dataLoaded) return <NoDataPlaceholder />;

  return (
    <div className="space-y-6">
      <AnnualSummaryTable summaries={annualSummaries} />
      <MortgageScheduleTable schedule={schedule} />
      <RawDataTable income={state.incomeData} expenses={state.expenseData} />
    </div>
  );
}

function AppContent() {
  const { state } = useAppContext();

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <PageContainer>
          {state.activeTab === 'setup' && <SetupTab />}
          {state.activeTab === 'past' && <PastTab />}
          {state.activeTab === 'future' && <FutureTab />}
          {state.activeTab === 'data' && <DataTab />}
        </PageContainer>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
