import { GitBranch } from 'lucide-react';
import { useApiQuery } from '../../../hooks/useApiQuery.js';
import { dashboardService } from '../../../services/dashboardService.js';
import { ChartCard } from './ChartCard.jsx';
import { ListSkeleton } from '../../../components/common/Skeleton.jsx';
import { STAGE_LABELS, STAGE_COLORS } from '../../../utils/dashboardEnums.js';
import { formatCompactCurrency } from '../../../utils/formatters.js';

export const SalesPipeline = () => {
  const { data, isLoading, error, refetch } = useApiQuery(() => dashboardService.getPipeline(), []);

  const totalDeals = data?.reduce((sum, s) => sum + s.count, 0) || 0;
  const isEmpty = !isLoading && !error && totalDeals === 0;

  return (
    <ChartCard
      title="Sales Pipeline"
      subtitle={!isLoading && !error && !isEmpty ? `${totalDeals} open & closed deals` : undefined}
      isLoading={isLoading}
      error={error}
      isEmpty={isEmpty}
      errorMessage="Couldn't load the sales pipeline."
      onRetry={refetch}
      skeleton={<ListSkeleton rows={3} />}
      emptyProps={{
        icon: GitBranch,
        title: 'Pipeline is empty',
        description: 'Opportunities will show up here as deals are created.',
      }}
    >
      <div className="space-y-5 px-5 py-5">
        {/* Segmented proportional bar */}
        <div className="flex h-3 w-full overflow-hidden rounded-full bg-surface-200">
          {data?.map(
            (s) =>
              s.count > 0 && (
                <div
                  key={s.stage}
                  className="h-full transition-all"
                  style={{
                    width: `${(s.count / totalDeals) * 100}%`,
                    backgroundColor: STAGE_COLORS[s.stage],
                  }}
                  title={`${STAGE_LABELS[s.stage]}: ${s.count}`}
                />
              )
          )}
        </div>

        {/* Stage breakdown */}
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {data?.map((s) => (
            <li key={s.stage} className="flex items-center justify-between gap-3 text-sm">
              <span className="flex items-center gap-2 text-ink-700">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: STAGE_COLORS[s.stage] }}
                  aria-hidden="true"
                />
                {STAGE_LABELS[s.stage]}
              </span>
              <span className="text-right text-ink-600">
                <span className="font-medium text-ink-800">{s.count}</span>{' '}
                <span className="text-xs">· {formatCompactCurrency(s.value)}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </ChartCard>
  );
};
