import { NavLink, Outlet } from 'react-router-dom';
import clsx from 'clsx';
import { useAuth } from '../../../context/AuthContext.jsx';
import { SETTINGS_SECTIONS } from './settingsNav.js';

export const SettingsShell = () => {
  const { user } = useAuth();

  const visibleSections = SETTINGS_SECTIONS.filter((section) => !section.roles || section.roles.includes(user?.role));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">Settings</h1>
        <p className="mt-1 text-sm text-ink-600">Manage your account, preferences, and workspace.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[220px_1fr]">
        <nav className="space-y-5 lg:sticky lg:top-20 lg:self-start">
          {visibleSections.map((section) => (
            <div key={section.group}>
              <p className="px-3 text-xs font-semibold uppercase tracking-wide text-ink-600">{section.group}</p>
              <div className="mt-1.5 space-y-0.5">
                {section.items.map(({ label, to, icon: Icon }) => (
                  <NavLink
                    key={to}
                    to={to}
                    className={({ isActive }) =>
                      clsx(
                        'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                        isActive ? 'bg-brand-50 text-brand-700' : 'text-ink-700 hover:bg-surface-200'
                      )
                    }
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="min-w-0">
          <Outlet />
        </div>
      </div>
    </div>
  );
};
