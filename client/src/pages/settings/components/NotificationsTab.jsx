import { useState } from 'react';
import { Bell, Target, Briefcase, ListTodo, ShieldAlert, Settings, Info, CheckCheck } from 'lucide-react';
import clsx from 'clsx';
import { Card, CardHeader } from '../../../components/ui/Card.jsx';
import { Select } from '../../../components/ui/Select.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { Pagination } from '../../../components/ui/Pagination.jsx';
import { ListSkeleton } from '../../../components/common/Skeleton.jsx';
import { ErrorState } from '../../../components/common/ErrorState.jsx';
import { EmptyState } from '../../../components/common/EmptyState.jsx';
import { useApiQuery } from '../../../hooks/useApiQuery.js';
import { notificationService } from '../../../services/notificationService.js';
import { useNotifications } from '../../../context/NotificationContext.jsx';
import { formatRelativeTime } from '../../../utils/formatters.js';

const CATEGORY_ICONS = { task: ListTodo, lead: Target, opportunity: Briefcase, followup: Target, security: ShieldAlert, admin: Settings, system: Info };
const CATEGORIES = ['task', 'lead', 'opportunity', 'followup', 'security', 'admin', 'system'];

export const NotificationsTab = () => {
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState('');
  const { markAllAsRead: markAllAsReadInHeader, refetch: refetchHeaderCount } = useNotifications();

  const { data, isLoading, error, refetch } = useApiQuery(
    () => notificationService.list({ page, limit: 15, category: category || undefined }),
    [page, category]
  );

  const handleMarkAllRead = async () => {
    await markAllAsReadInHeader();
    refetch();
  };

  const handleMarkOneRead = async (id) => {
    await notificationService.markAsRead(id);
    refetch();
    refetchHeaderCount();
  };

  return (
    <Card>
      <CardHeader
        title="All Notifications"
        subtitle="Every notification you've received"
        action={
          <div className="flex items-center gap-2">
            <Select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }} className="w-36">
              <option value="">All categories</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c} className="capitalize">
                  {c}
                </option>
              ))}
            </Select>
            <Button variant="secondary" size="sm" onClick={handleMarkAllRead}>
              <CheckCheck className="h-4 w-4" /> Mark all read
            </Button>
          </div>
        }
      />

      {isLoading && <ListSkeleton rows={6} />}
      {error && <ErrorState message="Couldn't load notifications." onRetry={refetch} />}
      {!isLoading && !error && data.items.length === 0 && (
        <EmptyState icon={Bell} title="No notifications" description="Nothing here yet." />
      )}
      {!isLoading && !error && data.items.length > 0 && (
        <ul className="divide-y divide-surface-300">
          {data.items.map((n) => {
            const Icon = CATEGORY_ICONS[n.type] || Info;
            return (
              <li key={n._id} className="flex items-start gap-3 px-5 py-4">
                <span
                  className={clsx(
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
                    n.isRead ? 'bg-surface-200 text-ink-600' : 'bg-brand-50 text-brand-600'
                  )}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className={clsx('text-sm', n.isRead ? 'text-ink-700' : 'font-medium text-ink-800')}>{n.title}</p>
                  {n.message && <p className="mt-0.5 text-sm text-ink-600">{n.message}</p>}
                  <p className="mt-1 text-xs text-ink-600/70">{formatRelativeTime(n.createdAt)}</p>
                </div>
                {!n.isRead && (
                  <button
                    type="button"
                    onClick={() => handleMarkOneRead(n._id)}
                    className="shrink-0 text-xs font-medium text-brand-600 hover:text-brand-700"
                  >
                    Mark read
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {data && (
        <Pagination page={data.meta.page} totalPages={data.meta.totalPages} total={data.meta.total} limit={data.meta.limit} onPageChange={setPage} />
      )}
    </Card>
  );
};
