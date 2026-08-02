import clsx from 'clsx';

export const Card = ({ as: Component = 'div', className, children, ...props }) => (
  <Component
    className={clsx(
      'rounded-xl border border-surface-300 bg-surface-100 shadow-card',
      className
    )}
    {...props}
  >
    {children}
  </Component>
);

export const CardHeader = ({ title, subtitle, action, className }) => (
  <div className={clsx('flex items-start justify-between gap-3 border-b border-surface-300 px-5 py-4', className)}>
    <div>
      <h3 className="font-display text-sm font-semibold text-ink">{title}</h3>
      {subtitle && <p className="mt-0.5 text-xs text-ink-600">{subtitle}</p>}
    </div>
    {action}
  </div>
);
