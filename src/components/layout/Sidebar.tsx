import { PropertyConfigForm } from '../config/PropertyConfigForm';
import { MortgageConfigForm } from '../config/MortgageConfigForm';
import { AssumptionsForm } from '../config/AssumptionsForm';

export function Sidebar() {
  return (
    <aside className="w-72 bg-white border-r border-gray-200 overflow-y-auto flex-shrink-0">
      <div className="p-4 space-y-4">
        <PropertyConfigForm />
        <MortgageConfigForm />
        <AssumptionsForm />
      </div>
    </aside>
  );
}
