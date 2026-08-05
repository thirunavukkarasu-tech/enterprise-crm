import { NavLink } from 'react-router-dom';
import clsx from 'clsx';
import { X } from 'lucide-react';
import { NAV_ITEMS } from '../../utils/navigation.js';
import { useAuth } from '../../context/AuthContext.jsx';

/**
 * Brand mark: three ascending bars converging into a single signal dot —
 * a nod to a pipeline "narrowing" toward a closed deal. Used instead of a
 * generic logotype so the app has one small, ownable visual signature.
 */
const BrandMark = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
    <rect x="2" y="16" width="5" height="10" rx="1.5" fill="#2DD4C6" opacity="0.55" />
    <rect x="9.5" y="10" width="5" height="16" rx="1.5" fill="#2DD4C6" opacity="0.8" />
    <rect x="17" y="4" width="5" height="22" rx="1.5" fill="#2DD4C6" />
    <circle cx="24.5" cy="4.5" r="2.5" fill="#0EA5A0" />
  </svg>
);

export const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useAuth();

  const visibleItems = NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(user?.role));

  return (
    <>
      {/* Mobile scrim */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-ink/50 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-40 flex w-64 shrink-0 flex-col bg-ink transition-transform duration-200 lg:static lg:translate-x-0 print:hidden',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center justify-between px-5 py-5">
          <div className="flex items-center gap-2.5">
            <BrandMark />
            <span className="font-display text-lg font-semibold text-white">CRM Platform</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-surface-300 hover:text-white lg:hidden"
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="mt-2 flex-1 space-y-1 overflow-y-auto scrollbar-thin px-3">
          {visibleItems.map(({ label, to, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                clsx(
                  'group flex items-center gap-3 rounded-lg border-l-2 px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'border-brand-500 bg-ink-700 text-white'
                    : 'border-transparent text-surface-300/80 hover:bg-ink-700 hover:text-white'
                )
              }
            >
              <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-ink-700 px-5 py-4">
          <p className="text-xs text-surface-300/60">CRM Platform v1.0.0</p>
        </div>
      </aside>
    </>
  );
};
