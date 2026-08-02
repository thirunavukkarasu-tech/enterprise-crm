import { forwardRef } from 'react';
import clsx from 'clsx';

export const TextArea = forwardRef(({ label, error, className, id, rows = 3, ...props }, ref) => {
  const areaId = id || props.name;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={areaId} className="text-sm font-medium text-ink-700">
          {label}
        </label>
      )}
      <textarea
        id={areaId}
        ref={ref}
        rows={rows}
        aria-invalid={Boolean(error)}
        className={clsx(
          'w-full resize-none rounded-lg border bg-surface-100 px-3.5 py-2.5 text-sm text-ink-800',
          'placeholder:text-ink-600/50 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent',
          error ? 'border-rose-500' : 'border-surface-300',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-rose-600">{error}</p>}
    </div>
  );
});

TextArea.displayName = 'TextArea';
