import {
  UserPlus,
  Pencil,
  TrendingUp,
  Trash2,
  StickyNote,
  History,
} from 'lucide-react';
import { useApiQuery } from '../../../hooks/useApiQuery.js';
import { customerService } from '../../../services/customerService.js';
import { ListSkeleton } from '../../../components/common/Skeleton.jsx';
import { ErrorState } from '../../../components/common/ErrorState.jsx';
import { EmptyState } from '../../../components/common/EmptyState.jsx';
import { formatRelativeTime } from '../../../utils/formatters.js';

const ICONS = {
  customer_created: { icon: UserPlus, tone: 'text-brand-600 bg-brand-50' },
  customer_updated: { icon: Pencil, tone: 'text-amber-600 bg-amber-50' },
  customer_status_changed: { icon: TrendingUp, tone: 'text-brand-600 bg-brand-50' },
  customer_deleted: { icon: Trash2, tone: 'text-rose-600 bg-rose-50' },
  note_added: { icon: StickyNote, tone: 'text-ink-700 bg-surface-200' },
};

export const CustomerTimeline = ({ customerId }) => {
  const { data, isLoading, error, refetch } = useApiQuery(
    () => customerService.getTimeline(customerId),
    [customerId]
  );

  if (isLoading) return <ListSkeleton rows={5} />;
  if (error) return <ErrorState message="Couldn't load this customer's timeline." onRetry={refetch} />;
  if (data.length === 0) {
    return (
      <EmptyState
        icon={History}
        title="No activity yet"
        description="Updates to this customer will show up here."
      />
    );
  }

  return (
    <ul className="space-y-4">
      {data.map((activity) => {
        const config = ICONS[activity.type] || ICONS.customer_updated;
        const Icon = config.icon;
        return (
          <li key={activity._id} className="flex gap-3">
            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${config.tone}`}>
              <Icon className="h-4 w-4" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm text-ink-800">{activity.description}</p>
              <p className="mt-0.5 text-xs text-ink-600">
                {activity.actor?.name || 'Someone'} · {formatRelativeTime(activity.createdAt)}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
};
