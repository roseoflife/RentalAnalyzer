import React from 'react';
import { useUser } from '@clerk/clerk-react';
import { Check, X } from 'lucide-react';
import { redirectToCheckout } from '../utils/stripe';
import { useAppContext } from '../context/AppContext';

const features = [
  { label: 'Properties', free: '1', pro: 'Unlimited' },
  { label: 'Historical analysis (Past tab)', free: true, pro: true },
  { label: '25-year projections (Future tab)', free: false, pro: true },
  { label: 'Basic charts', free: true, pro: true },
  { label: 'All charts & comparisons', free: false, pro: true },
  { label: 'Manual data entry', free: true, pro: true },
  { label: 'CSV / Excel upload', free: false, pro: true },
  { label: 'Recommendation engine', free: false, pro: true },
  { label: 'PDF export (coming soon)', free: false, pro: true },
];

function FeatureCell({ value }: { value: boolean | string }) {
  if (typeof value === 'string') {
    return <span className="text-sm font-medium text-gray-900">{value}</span>;
  }
  return value ? (
    <Check size={16} className="text-green-500" />
  ) : (
    <X size={16} className="text-gray-300" />
  );
}

export function PricingPage({ onClose }: { onClose: () => void }) {
  const { user } = useUser();
  const { state } = useAppContext();

  function handleSubscribe() {
    if (!user) return;
    redirectToCheckout(user.id);
  }

  if (state.subscription === 'pro') {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">You're on Pro!</h2>
          <p className="text-gray-500 mb-6">You have full access to all features.</p>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Upgrade to Pro</h2>
            <p className="text-gray-500">Unlock the full power of Triplex</p>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-8">
            {/* Header row */}
            <div />
            <div className="text-center p-4 rounded-xl bg-gray-50">
              <h3 className="font-semibold text-gray-900">Free</h3>
              <p className="text-2xl font-bold text-gray-900 mt-1">$0</p>
              <p className="text-xs text-gray-500">forever</p>
            </div>
            <div className="text-center p-4 rounded-xl bg-indigo-50 ring-2 ring-indigo-600">
              <h3 className="font-semibold text-indigo-900">Pro</h3>
              <p className="text-2xl font-bold text-indigo-900 mt-1">$15</p>
              <p className="text-xs text-indigo-600">/month</p>
            </div>

            {/* Feature rows */}
            {features.map((f) => (
              <React.Fragment key={f.label}>
                <div className="flex items-center text-sm text-gray-700">
                  {f.label}
                </div>
                <div className="flex items-center justify-center">
                  <FeatureCell value={f.free} />
                </div>
                <div className="flex items-center justify-center">
                  <FeatureCell value={f.pro} />
                </div>
              </React.Fragment>
            ))}
          </div>

          <div className="flex gap-3 justify-center">
            <button
              onClick={onClose}
              className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Maybe later
            </button>
            <button
              onClick={handleSubscribe}
              className="px-6 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Subscribe to Pro — $15/mo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
