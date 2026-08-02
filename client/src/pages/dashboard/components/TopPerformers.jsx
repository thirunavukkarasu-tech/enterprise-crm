import { Trophy, Award } from 'lucide-react';
import { useApiQuery } from '../../../hooks/useApiQuery.js';
import { dashboardService } from '../../../services/dashboardService.js';
import { ChartCard } from './ChartCard.jsx';
import { ListSkeleton } from '../../../components/common/Skeleton.jsx';
import { formatCompactCurrency } from '../../../utils/formatters.js';
import { ROLE_LABELS } from '../../../utils/roles.js';

const getInitials = (name = '') =>
  name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();

const RANK_STYLES = [
  'bg-amber-400 text-white', // 1st
  'bg-surface-300 text-ink-700', // 2nd
  'bg-amber-100 text-amber-700', // 3rd
];

export const TopPerformers = () => {
  const { data, isLoading, error, refetch } = useApiQuery(
    () => dashboardService.getTopPerformers(5),
    []
  );

  const isEmpty = !isLoading && !error && data?.length === 0;

  return (
    <ChartCard
      title="Top Performing Sales Executives"
      subtitle="Ranked by closed-won revenue"
      isLoading={isLoading}
      error={error}
      isEmpty={isEmpty}
      errorMessage="Couldn't load the leaderboard."
      onRetry={refetch}
      skeleton={<ListSkeleton rows={4} />}
      emptyProps={{
        icon: Trophy,
        title: 'No closed deals yet',
        description: 'Your top performers will be ranked here once deals start closing.',
      }}
    >
      <ul className="divide-y divide-surface-300">
        {data?.map((performer, i) => (
          <li key={performer.userId} className="flex items-center gap-3 px-5 py-3.5">
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                RANK_STYLES[i] || 'bg-surface-200 text-ink-600'
              }`}
            >
              {i < 3 ? <Award className="h-3.5 w-3.5" /> : i + 1}
            </span>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-500 text-xs font-semibold text-white">
              {getInitials(performer.name)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-ink-800">{performer.name}</p>
              <p className="text-xs text-ink-600">{ROLE_LABELS[performer.role]}</p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-sm font-semibold text-ink-800">{formatCompactCurrency(performer.revenue)}</p>
              <p className="text-xs text-ink-600">{performer.dealsWon} deals</p>
            </div>
          </li>
        ))}
      </ul>
    </ChartCard>
  );
};
