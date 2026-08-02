import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import clsx from 'clsx';
import { Card } from '../../../components/ui/Card.jsx';

/**
 * Dumb presentational card — receives fully-formed props so it can be
 * reused for any metric (customers, leads, opportunities, revenue) without
 * knowing where the number came from. Data-fetching lives one level up in
 * KpiCardsRow.
 */
export const KpiCard = ({ label, value, trend, icon: Icon, iconTone = 'brand', style }) => {
  const isPositive = trend >= 0;

  return (
    <Card className="animate-fade-in-up p-5" style={style}>
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-ink-600">{label}</p>
        {Icon && (
          <span
            className={clsx(
              'flex h-9 w-9 items-center justify-center rounded-lg',
              iconTone === 'brand' && 'bg-brand-50 text-brand-600',
              iconTone === 'amber' && 'bg-amber-50 text-amber-600',
              iconTone === 'rose' && 'bg-rose-50 text-rose-600'
            )}
          >
            <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
          </span>
        )}
      </div>

      <p className="mt-3 font-display text-2xl font-semibold text-ink">{value}</p>

      {trend !== undefined && (
        <div className="mt-2.5 flex items-center gap-1 text-xs">
          <span
            className={clsx(
              'flex items-center gap-0.5 font-medium',
              isPositive ? 'text-brand-600' : 'text-rose-600'
            )}
          >
            {isPositive ? (
              <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <ArrowDownRight className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            {Math.abs(trend)}%
          </span>
          <span className="text-ink-600">vs last month</span>
        </div>
      )}
    </Card>
  );
};
