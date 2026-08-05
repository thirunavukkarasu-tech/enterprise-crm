import { useState, useRef, useEffect } from 'react';
import { Menu, Search, Bell, ChevronDown, LogOut, UserRound, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { ROLE_LABELS } from '../../utils/roles.js';

const getInitials = (name = '') =>
  name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

export const Navbar = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const displayName = user?.name || 'Guest User';
  const displayRole = user?.role ? ROLE_LABELS[user.role] : 'Not signed in';

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-surface-300 bg-surface-100 px-4 lg:px-6 print:hidden">
      <button
        type="button"
        onClick={onMenuClick}
        className="text-ink-700 hover:text-ink lg:hidden"
        aria-label="Open navigation"
      >
        <Menu className="h-5.5 w-5.5" />
      </button>

      <div className="relative hidden max-w-sm flex-1 md:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-600/50" />
        <input
          type="search"
          placeholder="Search customers, leads, tasks…"
          className="w-full rounded-lg border border-surface-300 bg-surface py-2 pl-9 pr-3 text-sm text-ink-800 placeholder:text-ink-600/50 focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      <div className="flex flex-1 items-center justify-end gap-3">
        <button
          type="button"
          className="relative rounded-full p-2 text-ink-700 hover:bg-surface-200"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-rose-500" />
        </button>

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            className="flex items-center gap-2 rounded-lg py-1.5 pl-1.5 pr-2.5 hover:bg-surface-200"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-500 text-xs font-semibold text-white">
              {getInitials(displayName) || <UserRound className="h-4 w-4" />}
            </span>
            <span className="hidden text-left sm:block">
              <span className="block text-sm font-medium leading-tight text-ink-800">{displayName}</span>
              <span className="block text-xs leading-tight text-ink-600">{displayRole}</span>
            </span>
            <ChevronDown className="h-4 w-4 text-ink-600" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-48 rounded-xl border border-surface-300 bg-surface-100 py-1.5 shadow-popover">
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  navigate('/settings/profile');
                }}
                className="flex w-full items-center gap-2 px-3.5 py-2 text-sm text-ink-800 hover:bg-surface-200"
              >
                <UserRound className="h-4 w-4" /> My Profile
              </button>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  navigate('/settings');
                }}
                className="flex w-full items-center gap-2 px-3.5 py-2 text-sm text-ink-800 hover:bg-surface-200"
              >
                <Settings className="h-4 w-4" /> Settings
              </button>
              <hr className="my-1.5 border-surface-300" />
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-2 px-3.5 py-2 text-sm text-rose-600 hover:bg-rose-50"
              >
                <LogOut className="h-4 w-4" /> Log Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
