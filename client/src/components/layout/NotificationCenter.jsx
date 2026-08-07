import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, Target, Briefcase, ListTodo, ShieldAlert, Settings, Info } from 'lucide-react';
import clsx from 'clsx';
import { useNotifications } from '../../context/NotificationContext.jsx';
import { InlineLoader } from '../common/Loader.jsx';
import { ErrorState } from '../common/ErrorState.jsx';
import { EmptyState } from '../common/EmptyState.jsx';
import { formatRelativeTime } from '../../utils/formatters.js';

const CATEGORY_ICONS = {
  task: ListTodo,
  lead: Target,
  opportunity: Briefcase,
  followup: Target,
  security: ShieldAlert,
  admin: Settings,
  system: Info,
};

export const NotificationCenter = () => {
  const { items, unreadCount, isLoading, error, refetch, markAsRead, markAllAsRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        className="relative rounded-full p-2 text-ink-700 hover:bg-surface-200"
        aria-label={`Notifications${unreadCount > 0 ? ` — ${unreadCount} unread` : ''}`}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 z-30 mt-2 w-80 rounded-xl border border-surface-300 bg-surface-100 shadow-popover">
          <div className="flex items-center justify-between border-b border-surface-300 px-4 py-3">
            <h3 className="font-display text-sm font-semibold text-ink">Notifications</h3>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="flex items-center gap-1 text-xs font-medium text-brand-600 hover:text-brand-700"
              >
                <CheckCheck className="h-3.5 w-3.5" /> Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto scrollbar-thin">
            {isLoading && <InlineLoader label="Loading notifications…" />}
            {error && <ErrorState message="Couldn't load notifications." onRetry={refetch} />}
            {!isLoading && !error && items.length === 0 && (
              <EmptyState icon={Bell} title="You're all caught up" description="New notifications will appear here." />
            )}
            {!isLoading && !error && items.length > 0 && (
              <ul className="divide-y divide-surface-300">
                {items.map((n) => {
                  const Icon = CATEGORY_ICONS[n.type] || Info;
                  return (
                    <li key={n._id}>
                      <button
                        type="button"
                        onClick={() => !n.isRead && markAsRead(n._id)}
                        className={clsx(
                          'flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-surface-200',
                          !n.isRead && 'bg-brand-50/40'
                        )}
                      >
                        <span
                          className={clsx(
                            'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                            n.isRead ? 'bg-surface-200 text-ink-600' : 'bg-brand-50 text-brand-600'
                          )}
                        >
                          <Icon className="h-4 w-4" aria-hidden="true" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className={clsx('block text-sm', n.isRead ? 'text-ink-700' : 'font-medium text-ink-800')}>
                            {n.title}
                          </span>
                          {n.message && <span className="mt-0.5 block truncate text-xs text-ink-600">{n.message}</span>}
                          <span className="mt-1 block text-[11px] text-ink-600/70">{formatRelativeTime(n.createdAt)}</span>
                        </span>
                        {!n.isRead && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-500" aria-hidden="true" />}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="border-t border-surface-300 px-4 py-2.5 text-center">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                navigate('/settings/notifications');
              }}
              className="text-xs font-medium text-ink-600 hover:text-ink-800"
            >
              View all notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
