import { Building2, Upload, History, TrendingUp, Table } from 'lucide-react';
import { Tabs } from '../ui/Tabs';
import { useAppContext } from '../../context/AppContext';
import type { TabId } from '../../constants/defaults';

const tabs = [
  { id: 'setup' as const, label: 'Setup', icon: <Upload size={16} /> },
  { id: 'past' as const, label: 'Past', icon: <History size={16} /> },
  { id: 'future' as const, label: 'Future', icon: <TrendingUp size={16} /> },
  { id: 'data' as const, label: 'Data', icon: <Table size={16} /> },
];

export function Header() {
  const { state, dispatch } = useAppContext();

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
      <div className="flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 bg-indigo-600 rounded-lg">
            <Building2 size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Triplex</h1>
            <p className="text-xs text-gray-500">Rental Property Analyzer</p>
          </div>
        </div>
        <Tabs
          tabs={tabs}
          activeTab={state.activeTab}
          onChange={(id) => dispatch({ type: 'SET_ACTIVE_TAB', payload: id as TabId })}
        />
        <div className="text-xs text-gray-400 flex items-center gap-1.5">
          <span className="inline-block w-2 h-2 bg-green-400 rounded-full" />
          100% Client-Side
        </div>
      </div>
    </header>
  );
}
