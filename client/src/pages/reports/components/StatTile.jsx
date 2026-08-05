import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import clsx from 'clsx';

export const StatTile = ({ label, value, trend, sublabel }) => (
  <div className="rounded-xl border border-surface-300 bg-surface-100 p-4">
    <p className="text-xs font-medium uppercase tracking-wide text-ink-600">{label}</p>
    <p className="mt-2 font-display text-xl font-semibold text-ink">{value}</p>
    {trend !== undefined ? (
      <div className="mt-1.5 flex items-center gap-1 text-xs">
        <span className={clsx('flex items-center gap-0.5 font-medium', trend >= 0 ? 'text-brand-600' : 'text-rose-600')}>
          {trend >= 0 ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
          {Math.abs(trend)}%
        </span>
        <span className="text-ink-600">vs prior period</span>
      </div>
    ) : (
      sublabel && <p className="mt-1.5 text-xs text-ink-600">{sublabel}</p>
    )}
  </div>
);
