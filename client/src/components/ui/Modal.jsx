import { useEffect } from 'react';
import { X } from 'lucide-react';
import clsx from 'clsx';

const SIZES = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
};

/**
 * Every dashboard/customer modal (Add/Edit Customer, Delete confirmation,
 * Import summary) composes this instead of re-implementing the overlay +
 * escape-key + scroll-lock behavior each time.
 */
export const Modal = ({ isOpen, onClose, title, size = 'md', children, footer }) => {
  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-sidebar/50 animate-fade-in-up" onClick={onClose} aria-hidden="true" />
      <div
        className={clsx(
          'relative w-full animate-fade-in-up rounded-xl bg-surface-100 shadow-popover',
          SIZES[size]
        )}
      >
        <div className="flex items-center justify-between border-b border-surface-300 px-5 py-4">
          <h2 className="font-display text-base font-semibold text-ink">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-ink-600 hover:bg-surface-200 hover:text-ink-800"
            aria-label="Close dialog"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto scrollbar-thin px-5 py-5">{children}</div>
        {footer && <div className="flex justify-end gap-3 border-t border-surface-300 px-5 py-4">{footer}</div>}
      </div>
    </div>
  );
};
