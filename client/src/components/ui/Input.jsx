import { forwardRef } from 'react';
import clsx from 'clsx';

/**
 * forwardRef so react-hook-form's register() can attach its ref directly —
 * this is the standard pattern for controlled/uncontrolled hybrid inputs
 * used across every form in the app (Login, Customer form, Lead form, ...).
 */
export const Input = forwardRef(({ label, error, className, id, ...props }, ref) => {
  const inputId = id || props.name;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-ink-700">
          {label}
        </label>
      )}
      <input
        id={inputId}
        ref={ref}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${inputId}-error` : undefined}
        className={clsx(
          'w-full rounded-lg border bg-surface-100 px-3.5 py-2.5 text-sm text-ink-800',
          'placeholder:text-ink-600/50 transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent',
          error ? 'border-rose-500' : 'border-surface-300',
          className
        )}
        {...props}
      />
      {error && (
        <p id={`${inputId}-error`} className="text-xs text-rose-600">
          {error}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';
