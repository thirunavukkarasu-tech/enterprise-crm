import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';

const ThemeContext = createContext(undefined);
const STORAGE_KEY = 'crm_theme';

const getSystemPrefersDark = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;

const applyThemeClass = (theme) => {
  const isDark = theme === 'dark' || (theme === 'system' && getSystemPrefersDark());
  document.documentElement.classList.toggle('dark', isDark);
};

/**
 * Three-state theme ('light' | 'dark' | 'system'), applied by toggling a
 * single `dark` class on <html> — every color in the app resolves through
 * the CSS variables that class switches (see tailwind.config.js and
 * src/styles/index.css), so no component needs its own dark: variants.
 *
 * Source of truth is localStorage (works instantly, before the user's
 * profile has even loaded) and is additionally synced to the server via
 * `PATCH /users/me/preferences` from the Settings > Preferences page, so
 * the choice follows the user across devices — see
 * `pages/settings/components/PreferencesTab.jsx`.
 */
export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(() => localStorage.getItem(STORAGE_KEY) || 'system');

  useEffect(() => {
    applyThemeClass(theme);
  }, [theme]);

  // Live-update if the OS theme changes while "system" is selected.
  useEffect(() => {
    if (theme !== 'system') return undefined;
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => applyThemeClass('system');
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [theme]);

  const setTheme = useCallback((next) => {
    setThemeState(next);
    localStorage.setItem(STORAGE_KEY, next);
  }, []);

  /** Called once after login/profile load to adopt the server-saved preference, if any. */
  const hydrateFromServer = useCallback(
    (serverTheme) => {
      if (serverTheme && serverTheme !== theme && !localStorage.getItem(STORAGE_KEY)) {
        setTheme(serverTheme);
      }
    },
    [theme, setTheme]
  );

  const value = useMemo(() => ({ theme, setTheme, hydrateFromServer }), [theme, setTheme, hydrateFromServer]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
};
