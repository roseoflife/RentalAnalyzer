import { useState } from 'react';
import { Building2, Upload, History, TrendingUp, Table, Lock, Crown } from 'lucide-react';
import { SignInButton, SignUpButton, UserButton, SignedIn, SignedOut } from '@clerk/clerk-react';
import { Tabs } from '../ui/Tabs';
import { useAppContext } from '../../context/AppContext';
import { PricingPage } from '../PricingPage';
import type { TabId } from '../../constants/defaults';

export function Header() {
  const { state, dispatch } = useAppContext();
  const [showPricing, setShowPricing] = useState(false);
  const isPro = state.subscription === 'pro';

  const tabs = [
    { id: 'setup' as const, label: 'Setup', icon: <Upload size={16} /> },
    { id: 'past' as const, label: 'Past', icon: <History size={16} /> },
    {
      id: 'future' as const,
      label: 'Future',
      icon: isPro ? <TrendingUp size={16} /> : <Lock size={14} />,
      disabled: !isPro,
    },
    { id: 'data' as const, label: 'Data', icon: <Table size={16} /> },
  ];

  function handleTabChange(id: string) {
    if (id === 'future' && !isPro) {
      setShowPricing(true);
      return;
    }
    dispatch({ type: 'SET_ACTIVE_TAB', payload: id as TabId });
  }

  return (
    <>
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
            onChange={handleTabChange}
          />
          <div className="flex items-center gap-3">
            <SignedOut>
              <SignInButton mode="modal">
                <button className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors">
                  Sign in
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors">
                  Sign up
                </button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              {!isPro && (
                <button
                  onClick={() => setShowPricing(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-amber-700 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors"
                >
                  <Crown size={14} />
                  Upgrade to Pro
                </button>
              )}
              {isPro && (
                <span className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-indigo-700 bg-indigo-50 rounded-full">
                  <Crown size={12} />
                  Pro
                </span>
              )}
              <UserButton />
            </SignedIn>
          </div>
        </div>
      </header>
      {showPricing && <PricingPage onClose={() => setShowPricing(false)} />}
    </>
  );
}
