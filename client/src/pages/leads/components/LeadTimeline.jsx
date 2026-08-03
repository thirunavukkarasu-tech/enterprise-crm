import {
  UserPlus,
  Pencil,
  TrendingUp,
  Trash2,
  StickyNote,
  History,
  UserCog,
  ArrowRightCircle,
  Paperclip,
} from 'lucide-react';
import { useApiQuery } from '../../../hooks/useApiQuery.js';
import { leadService } from '../../../services/leadService.js';
import { ListSkeleton } from '../../../components/common/Skeleton.jsx';
import { ErrorState } from '../../../components/common/ErrorState.jsx';
import { EmptyState } from '../../../components/common/EmptyState.jsx';
import { formatRelativeTime } from '../../../utils/formatters.js';

const ICONS = {
  lead_created: { icon: UserPlus, tone: 'text-brand-600 bg-brand-50' },
  lead_updated: { icon: Pencil, tone: 'text-amber-600 bg-amber-50' },
  lead_status_changed: { icon: TrendingUp, tone: 'text-brand-600 bg-brand-50' },
  lead_assigned: { icon: UserCog, tone: 'text-amber-600 bg-amber-50' },
  lead_converted: { icon: ArrowRightCircle, tone: 'text-brand-600 bg-brand-50' },
  lead_deleted: { icon: Trash2, tone: 'text-rose-600 bg-rose-50' },
  lead_note_added: { icon: StickyNote, tone: 'text-ink-700 bg-surface-200' },
  lead_attachment_added: { icon: Paperclip, tone: 'text-ink-700 bg-surface-200' },
};

export const LeadTimeline = ({ leadId }) => {
  const { data, isLoading, error, refetch } = useApiQuery(() => leadService.getTimeline(leadId), [leadId]);

  if (isLoading) return <ListSkeleton rows={5} />;
  if (error) return <ErrorState message="Couldn't load this lead's timeline." onRetry={refetch} />;
  if (data.length === 0) {
    return (
      <EmptyState icon={History} title="No activity yet" description="Updates to this lead will show up here." />
    );
  }

  return (
    <ul className="space-y-4">
      {data.map((activity) => {
        const config = ICONS[activity.type] || ICONS.lead_updated;
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
