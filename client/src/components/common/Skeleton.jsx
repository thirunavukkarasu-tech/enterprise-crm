import clsx from 'clsx';

/**
 * Base shimmer block. Every widget-specific skeleton (KpiCardSkeleton,
 * ChartSkeleton, ListSkeleton...) composes this instead of each rolling
 * its own animated div, so the shimmer timing/easing stays consistent
 * app-wide.
 */
export const SkeletonBlock = ({ className, style }) => (
  <div className={clsx('animate-pulse rounded-md bg-surface-300/70', className)} style={style} aria-hidden="true" />
);

export const KpiCardSkeleton = () => (
  <div className="rounded-xl border border-surface-300 bg-surface-100 p-5">
    <SkeletonBlock className="h-3.5 w-24" />
    <SkeletonBlock className="mt-4 h-7 w-32" />
    <SkeletonBlock className="mt-3 h-3 w-20" />
  </div>
);

export const ChartSkeleton = ({ height = 260 }) => (
  <div className="flex items-end gap-2 px-5 py-4" style={{ height }}>
    {[40, 65, 50, 80, 55, 90, 70].map((h, i) => (
      <SkeletonBlock key={i} className="flex-1" style={{ height: `${h}%` }} />
    ))}
  </div>
);

export const ListSkeleton = ({ rows = 4 }) => (
  <div className="space-y-4 px-5 py-4">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex items-center gap-3">
        <SkeletonBlock className="h-9 w-9 shrink-0 rounded-full" />
        <div className="flex-1 space-y-2">
          <SkeletonBlock className="h-3 w-3/4" />
          <SkeletonBlock className="h-2.5 w-1/2" />
        </div>
      </div>
    ))}
  </div>
);
