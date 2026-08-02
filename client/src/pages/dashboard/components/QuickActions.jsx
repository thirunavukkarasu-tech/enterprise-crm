import { UserPlus, Target, CheckSquare, PhoneCall } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../../components/ui/Card.jsx';

const ACTIONS = [
  { label: 'Add Customer', to: '/customers?new=1', icon: UserPlus, tone: 'bg-brand-50 text-brand-600' },
  { label: 'Add Lead', to: '/leads', icon: Target, tone: 'bg-amber-50 text-amber-600' },
  { label: 'Create Task', to: '/tasks', icon: CheckSquare, tone: 'bg-brand-50 text-brand-600' },
  { label: 'Log Follow-up', to: '/followups', icon: PhoneCall, tone: 'bg-amber-50 text-amber-600' },
];

/**
 * Static shortcuts — no data fetching needed, so this renders immediately
 * with no loading state. Routes to each module's page; those modules are
 * scaffolded (Phase 1) and ship fully in their own phase.
 */
export const QuickActions = () => {
  const navigate = useNavigate();

  return (
    <Card className="p-5">
      <h3 className="font-display text-sm font-semibold text-ink">Quick Actions</h3>
      <div className="mt-4 grid grid-cols-2 gap-3">
        {ACTIONS.map(({ label, to, icon: Icon, tone }) => (
          <button
            key={label}
            type="button"
            onClick={() => navigate(to)}
            className="flex flex-col items-start gap-2.5 rounded-lg border border-surface-300 p-3.5 text-left transition-colors hover:border-brand-300 hover:bg-brand-50/40"
          >
            <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${tone}`}>
              <Icon className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="text-sm font-medium text-ink-800">{label}</span>
          </button>
        ))}
      </div>
    </Card>
  );
};
