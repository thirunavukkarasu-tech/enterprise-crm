import { useState } from 'react';
import toast from 'react-hot-toast';
import { Sun, Moon, Monitor } from 'lucide-react';
import clsx from 'clsx';
import { Card, CardHeader } from '../../../components/ui/Card.jsx';
import { useApiQuery } from '../../../hooks/useApiQuery.js';
import { userService } from '../../../services/userService.js';
import { useTheme } from '../../../context/ThemeContext.jsx';
import { useAuth } from '../../../context/AuthContext.jsx';
import { FullPageLoader } from '../../../components/common/Loader.jsx';
import { ErrorState } from '../../../components/common/ErrorState.jsx';

const THEME_OPTIONS = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
];

const EMAIL_PREFS = [
  { key: 'taskReminders', label: 'Task reminders', description: 'Email me when a task reminder is due.' },
  { key: 'leadUpdates', label: 'Lead updates', description: 'Email me when a lead is assigned or changes status.' },
  { key: 'weeklyDigest', label: 'Weekly digest', description: 'A weekly summary of your pipeline activity.' },
];

export const PreferencesTab = () => {
  const { theme, setTheme } = useTheme();
  const { updateUser } = useAuth();
  const { data: profile, isLoading, error, refetch, setData } = useApiQuery(() => userService.getMyProfile(), []);
  const [savingKey, setSavingKey] = useState(null);

  const handleThemeChange = async (value) => {
    setTheme(value); // apply instantly — don't wait on the network round-trip
    setSavingKey('theme');
    try {
      const updated = await userService.updateMyPreferences({ theme: value });
      setData(updated);
      updateUser(updated);
    } catch (err) {
      toast.error('Could not save your theme preference.');
    } finally {
      setSavingKey(null);
    }
  };

  const handleEmailToggle = async (key, value) => {
    const previous = profile;
    setData((prev) => ({
      ...prev,
      preferences: { ...prev.preferences, emailNotifications: { ...prev.preferences.emailNotifications, [key]: value } },
    }));
    setSavingKey(key);
    try {
      const updated = await userService.updateMyPreferences({ emailNotifications: { [key]: value } });
      setData(updated);
      updateUser(updated);
    } catch (err) {
      setData(previous);
      toast.error('Could not save that preference.');
    } finally {
      setSavingKey(null);
    }
  };

  if (isLoading) return <FullPageLoader label="Loading preferences…" />;
  if (error) return <ErrorState message="Couldn't load your preferences." onRetry={refetch} />;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader title="Theme" subtitle="Choose how the CRM looks on this device" />
        <div className="grid grid-cols-1 gap-3 px-5 py-5 sm:grid-cols-3">
          {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => handleThemeChange(value)}
              disabled={savingKey === 'theme'}
              className={clsx(
                'flex flex-col items-center gap-2 rounded-xl border p-4 transition-colors disabled:opacity-60',
                theme === value ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-surface-300 hover:bg-surface-200'
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-sm font-medium">{label}</span>
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader title="Email Preferences" subtitle="Choose which emails you'd like to receive" />
        <ul className="divide-y divide-surface-300">
          {EMAIL_PREFS.map(({ key, label, description }) => {
            const checked = profile.preferences.emailNotifications[key];
            return (
              <li key={key} className="flex items-center justify-between gap-4 px-5 py-4">
                <div>
                  <p className="text-sm font-medium text-ink-800">{label}</p>
                  <p className="mt-0.5 text-xs text-ink-600">{description}</p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={checked}
                  disabled={savingKey === key}
                  onClick={() => handleEmailToggle(key, !checked)}
                  className={clsx(
                    'relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-60',
                    checked ? 'bg-brand-500' : 'bg-surface-300'
                  )}
                >
                  <span
                    className={clsx(
                      'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform',
                      checked ? 'translate-x-[22px]' : 'translate-x-0.5'
                    )}
                  />
                </button>
              </li>
            );
          })}
        </ul>
      </Card>
    </div>
  );
};
