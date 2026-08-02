import {
  UserPlus,
  Target,
  TrendingUp,
  Briefcase,
  Trophy,
  XCircle,
  CheckCircle2,
  Phone,
  Calendar,
  StickyNote,
  History,
} from 'lucide-react';
import { useApiQuery } from '../../../hooks/useApiQuery.js';
import { dashboardService } from '../../../services/dashboardService.js';
import { ChartCard } from './ChartCard.jsx';
import { ListSkeleton } from '../../../components/common/Skeleton.jsx';
import { formatRelativeTime } from '../../../utils/formatters.js';

const ICONS = {
  customer_created: { icon: UserPlus, tone: 'text-brand-600 bg-brand-50' },
  lead_created: { icon: Target, tone: 'text-amber-600 bg-amber-50' },
  lead_status_changed: { icon: TrendingUp, tone: 'text-brand-600 bg-brand-50' },
  opportunity_created: { icon: Briefcase, tone: 'text-brand-600 bg-brand-50' },
  opportunity_won: { icon: Trophy, tone: 'text-brand-600 bg-brand-50' },
  opportunity_lost: { icon: XCircle, tone: 'text-rose-600 bg-rose-50' },
  task_completed: { icon: CheckCircle2, tone: 'text-brand-600 bg-brand-50' },
  call_logged: { icon: Phone, tone: 'text-amber-600 bg-amber-50' },
  meeting_scheduled: { icon: Calendar, tone: 'text-amber-600 bg-amber-50' },
  note_added: { icon: StickyNote, tone: 'text-ink-700 bg-surface-200' },
};

const ActivityItem = ({ activity }) => {
  const config = ICONS[activity.type] || ICONS.note_added;
  const Icon = config.icon;

  return (
    <li className="flex gap-3">
      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${config.tone}`}>
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1 pb-4">
        <p className="text-sm text-ink-800">{activity.description}</p>
        <p className="mt-0.5 text-xs text-ink-600">
          {activity.actor?.name || 'Someone'} · {formatRelativeTime(activity.createdAt)}
        </p>
      </div>
    </li>
  );
};

export const ActivityTimeline = () => {
  const { data, isLoading, error, refetch } = useApiQuery(
    () => dashboardService.getRecentActivities(8),
    []
  );

  const isEmpty = !isLoading && !error && data?.length === 0;

  return (
    <ChartCard
      title="Recent Activities"
      subtitle="Latest updates across your team"
      isLoading={isLoading}
      error={error}
      isEmpty={isEmpty}
      errorMessage="Couldn't load recent activity."
      onRetry={refetch}
      skeleton={<ListSkeleton rows={5} />}
      emptyProps={{
        icon: History,
        title: 'No activity yet',
        description: 'Actions across customers, leads, and deals will show up here.',
      }}
    >
      <ul className="max-h-[360px] overflow-y-auto scrollbar-thin px-5 py-4">
        {data?.map((activity) => (
          <ActivityItem key={activity._id} activity={activity} />
        ))}
      </ul>
    </ChartCard>
  );
};
