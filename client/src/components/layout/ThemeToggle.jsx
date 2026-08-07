import { useEffect, useRef, useState } from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import clsx from 'clsx';
import { useTheme } from '../../context/ThemeContext.jsx';

const OPTIONS = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
];

/**
 * Compact icon-only trigger in the Navbar; the fuller version with labels
 * lives in Settings > Preferences (see pages/settings/components/PreferencesTab.jsx).
 * Both call the same `setTheme` so they can never disagree.
 */
export const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const CurrentIcon = OPTIONS.find((o) => o.value === theme)?.icon || Monitor;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        className="rounded-full p-2 text-ink-700 hover:bg-surface-200"
        aria-label="Change theme"
      >
        <CurrentIcon className="h-5 w-5" />
      </button>

      {isOpen && (
        <div className="absolute right-0 z-30 mt-2 w-36 rounded-xl border border-surface-300 bg-surface-100 py-1.5 shadow-popover">
          {OPTIONS.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                setTheme(value);
                setIsOpen(false);
              }}
              className={clsx(
                'flex w-full items-center gap-2 px-3.5 py-2 text-sm hover:bg-surface-200',
                theme === value ? 'font-medium text-brand-600' : 'text-ink-800'
              )}
            >
              <Icon className="h-4 w-4" /> {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
