import { useState } from 'react';
import clsx from 'clsx';
import { Calendar } from 'lucide-react';

const startOfDay = (d) => {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
};
const endOfToday = () => {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
};

const PRESETS = [
  { label: '30D', days: 30 },
  { label: '90D', days: 90 },
  {
    label: 'This Year',
    range: () => ({ from: new Date(new Date().getFullYear(), 0, 1), to: endOfToday() }),
  },
  {
    label: 'Last 12M',
    range: () => ({ from: startOfDay(new Date(new Date().setMonth(new Date().getMonth() - 12))), to: endOfToday() }),
  },
];

const toInputValue = (date) => date.toISOString().slice(0, 10);

/**
 * Combines the two filter controls every report tab needs: a date range
 * (via quick presets or a custom from/to pair) and a month/year grouping
 * toggle for trend charts. Kept as one component since Reports always uses
 * them together — splitting them would just mean every tab re-composing
 * the same two pieces side by side.
 */
export const DateRangeFilter = ({ from, to, onChange, groupBy, onGroupByChange }) => {
  const [showCustom, setShowCustom] = useState(false);

  const applyPreset = (preset) => {
    const range = preset.range ? preset.range() : { from: startOfDay(new Date(Date.now() - preset.days * 86400000)), to: endOfToday() };
    onChange(range);
    setShowCustom(false);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Calendar className="h-4 w-4 text-ink-600" aria-hidden="true" />

      {PRESETS.map((preset) => (
        <button
          key={preset.label}
          type="button"
          onClick={() => applyPreset(preset)}
          className="rounded-lg border border-surface-300 px-3 py-1.5 text-xs font-medium text-ink-700 hover:bg-surface-200"
        >
          {preset.label}
        </button>
      ))}

      <button
        type="button"
        onClick={() => setShowCustom((s) => !s)}
        className={clsx(
          'rounded-lg border px-3 py-1.5 text-xs font-medium',
          showCustom ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-surface-300 text-ink-700 hover:bg-surface-200'
        )}
      >
        Custom
      </button>

      {showCustom && (
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={toInputValue(from)}
            onChange={(e) => onChange({ from: startOfDay(new Date(e.target.value)), to })}
            className="rounded-lg border border-surface-300 px-2.5 py-1.5 text-xs text-ink-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <span className="text-xs text-ink-600">to</span>
          <input
            type="date"
            value={toInputValue(to)}
            onChange={(e) => onChange({ from, to: new Date(new Date(e.target.value).setHours(23, 59, 59, 999)) })}
            className="rounded-lg border border-surface-300 px-2.5 py-1.5 text-xs text-ink-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
      )}

      <div className="ml-auto flex items-center gap-1 rounded-lg border border-surface-300 p-0.5">
        {['month', 'year'].map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => onGroupByChange(g)}
            className={clsx(
              'rounded-md px-2.5 py-1 text-xs font-medium capitalize',
              groupBy === g ? 'bg-brand-500 text-white' : 'text-ink-600 hover:bg-surface-200'
            )}
          >
            {g}ly
          </button>
        ))}
      </div>
    </div>
  );
};
