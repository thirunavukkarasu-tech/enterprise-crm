import { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';
import clsx from 'clsx';

export const Select = forwardRef(({ label, error, className, id, children, ...props }, ref) => {
  const selectId = id || props.name;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={selectId} className="text-sm font-medium text-ink-700">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={selectId}
          ref={ref}
          aria-invalid={Boolean(error)}
          className={clsx(
            'w-full appearance-none rounded-lg border bg-surface-100 px-3.5 py-2.5 pr-9 text-sm text-ink-800',
            'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent',
            error ? 'border-rose-500' : 'border-surface-300',
            className
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-600/60" />
      </div>
      {error && <p className="text-xs text-rose-600">{error}</p>}
    </div>
  );
});

Select.displayName = 'Select';
