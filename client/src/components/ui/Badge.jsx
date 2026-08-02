import clsx from 'clsx';

const TONES = {
  neutral: 'bg-surface-200 text-ink-700',
  brand: 'bg-brand-50 text-brand-700',
  amber: 'bg-amber-50 text-amber-600',
  rose: 'bg-rose-50 text-rose-600',
};

export const Badge = ({ tone = 'neutral', className, children }) => (
  <span
    className={clsx(
      'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium leading-none',
      TONES[tone],
      className
    )}
  >
    {children}
  </span>
);
