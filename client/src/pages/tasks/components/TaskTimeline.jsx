import {
  PlusCircle,
  Pencil,
  TrendingUp,
  UserCog,
  CheckCircle2,
  Trash2,
  MessageSquare,
  Paperclip,
  History,
} from 'lucide-react';
import { useApiQuery } from '../../../hooks/useApiQuery.js';
import { taskService } from '../../../services/taskService.js';
import { ListSkeleton } from '../../../components/common/Skeleton.jsx';
import { ErrorState } from '../../../components/common/ErrorState.jsx';
import { EmptyState } from '../../../components/common/EmptyState.jsx';
import { formatRelativeTime } from '../../../utils/formatters.js';

const ICONS = {
  task_created: { icon: PlusCircle, tone: 'text-brand-600 bg-brand-50' },
  task_updated: { icon: Pencil, tone: 'text-amber-600 bg-amber-50' },
  task_status_changed: { icon: TrendingUp, tone: 'text-brand-600 bg-brand-50' },
  task_assigned: { icon: UserCog, tone: 'text-amber-600 bg-amber-50' },
  task_completed: { icon: CheckCircle2, tone: 'text-brand-600 bg-brand-50' },
  task_deleted: { icon: Trash2, tone: 'text-rose-600 bg-rose-50' },
  task_comment_added: { icon: MessageSquare, tone: 'text-ink-700 bg-surface-200' },
  task_attachment_added: { icon: Paperclip, tone: 'text-ink-700 bg-surface-200' },
};

export const TaskTimeline = ({ taskId }) => {
  const { data, isLoading, error, refetch } = useApiQuery(() => taskService.getTimeline(taskId), [taskId]);

  if (isLoading) return <ListSkeleton rows={5} />;
  if (error) return <ErrorState message="Couldn't load this task's timeline." onRetry={refetch} />;
  if (data.length === 0) {
    return <EmptyState icon={History} title="No activity yet" description="Updates to this task will show up here." />;
  }

  return (
    <ul className="space-y-4">
      {data.map((activity) => {
        const config = ICONS[activity.type] || ICONS.task_updated;
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
