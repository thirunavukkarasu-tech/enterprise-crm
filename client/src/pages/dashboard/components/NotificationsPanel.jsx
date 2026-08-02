import { Bell, BellOff, Target, Briefcase, ListTodo, Info } from 'lucide-react';
import clsx from 'clsx';
import { useApiQuery } from '../../../hooks/useApiQuery.js';
import { dashboardService } from '../../../services/dashboardService.js';
import { ChartCard } from './ChartCard.jsx';
import { ListSkeleton } from '../../../components/common/Skeleton.jsx';
import { formatRelativeTime } from '../../../utils/formatters.js';

const TYPE_ICONS = {
  lead: Target,
  opportunity: Briefcase,
  task: ListTodo,
  system: Info,
};

export const NotificationsPanel = () => {
  const { data, isLoading, error, refetch } = useApiQuery(
    () => dashboardService.getNotifications(6),
    []
  );

  const isEmpty = !isLoading && !error && data?.items.length === 0;

  return (
    <ChartCard
      title="Notifications"
      subtitle={
        !isLoading && !error && data?.unreadCount > 0 ? `${data.unreadCount} unread` : undefined
      }
      action={
        !isLoading && !error && data?.unreadCount > 0 && (
          <span className="flex h-2 w-2 rounded-full bg-rose-500" aria-hidden="true" />
        )
      }
      isLoading={isLoading}
      error={error}
      isEmpty={isEmpty}
      errorMessage="Couldn't load notifications."
      onRetry={refetch}
      skeleton={<ListSkeleton rows={4} />}
      emptyProps={{
        icon: BellOff,
        title: "You're all caught up",
        description: 'New notifications will appear here.',
      }}
    >
      <ul className="divide-y divide-surface-300">
        {data?.items.map((n) => {
          const Icon = TYPE_ICONS[n.type] || Bell;
          return (
            <li key={n._id} className="flex gap-3 px-5 py-3.5">
              <span
                className={clsx(
                  'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                  n.isRead ? 'bg-surface-200 text-ink-600' : 'bg-brand-50 text-brand-600'
                )}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className={clsx('text-sm', n.isRead ? 'text-ink-700' : 'font-medium text-ink-800')}>
                  {n.title}
                </p>
                {n.message && <p className="mt-0.5 truncate text-xs text-ink-600">{n.message}</p>}
                <p className="mt-1 text-[11px] text-ink-600/70">{formatRelativeTime(n.createdAt)}</p>
              </div>
              {!n.isRead && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-500" aria-hidden="true" />}
            </li>
          );
        })}
      </ul>
    </ChartCard>
  );
};
