import { ListTodo, CheckSquare } from 'lucide-react';
import clsx from 'clsx';
import { useApiQuery } from '../../../hooks/useApiQuery.js';
import { dashboardService } from '../../../services/dashboardService.js';
import { ChartCard } from './ChartCard.jsx';
import { ListSkeleton } from '../../../components/common/Skeleton.jsx';
import { PRIORITY_COLORS } from '../../../utils/dashboardEnums.js';
import { formatDueDate } from '../../../utils/formatters.js';

export const UpcomingTasks = () => {
  const { data, isLoading, error, refetch } = useApiQuery(
    () => dashboardService.getUpcomingTasks(5),
    []
  );

  const isEmpty = !isLoading && !error && data?.length === 0;

  return (
    <ChartCard
      title="Upcoming Tasks"
      subtitle="Sorted by due date"
      isLoading={isLoading}
      error={error}
      isEmpty={isEmpty}
      errorMessage="Couldn't load upcoming tasks."
      onRetry={refetch}
      skeleton={<ListSkeleton rows={4} />}
      emptyProps={{
        icon: CheckSquare,
        title: "You're all caught up",
        description: 'No pending tasks due right now.',
      }}
    >
      <ul className="divide-y divide-surface-300">
        {data?.map((task) => {
          const overdue = new Date(task.dueDate) < new Date() && task.status !== 'completed';
          return (
            <li key={task._id} className="flex items-start gap-3 px-5 py-3.5">
              <span
                className={clsx(
                  'mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border',
                  overdue ? 'border-rose-300 bg-rose-50' : 'border-surface-300 bg-surface-200'
                )}
              >
                <ListTodo className={clsx('h-3.5 w-3.5', overdue ? 'text-rose-600' : 'text-ink-600')} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink-800">{task.title}</p>
                <p className="mt-0.5 text-xs text-ink-600">
                  {task.assignedTo?.name || 'Unassigned'}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1.5">
                <span className={clsx('text-xs font-medium', overdue ? 'text-rose-600' : 'text-ink-600')}>
                  {formatDueDate(task.dueDate)}
                </span>
                <span
                  className={clsx(
                    'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium capitalize leading-none',
                    PRIORITY_COLORS[task.priority].bg,
                    PRIORITY_COLORS[task.priority].text
                  )}
                >
                  {task.priority}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </ChartCard>
  );
};
