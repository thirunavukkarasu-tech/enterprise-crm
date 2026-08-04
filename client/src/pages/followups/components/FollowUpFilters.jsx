import { Search, X } from 'lucide-react';
import { Select } from '../../../components/ui/Select.jsx';
import { FOLLOWUP_TYPES, FOLLOWUP_TYPE_LABELS, FOLLOWUP_STATUSES, FOLLOWUP_STATUS_LABELS } from '../../../utils/followupEnums.js';

export const FollowUpFilters = ({ filters, onChange }) => {
  const hasActiveFilters = filters.q || filters.type || filters.status;

  const clear = () => onChange({ q: '', type: '', status: '' });

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      <div className="relative flex-1 sm:max-w-xs">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-600/50" />
        <input
          type="search"
          value={filters.q}
          onChange={(e) => onChange({ ...filters, q: e.target.value })}
          placeholder="Search by subject…"
          className="w-full rounded-lg border border-surface-300 bg-surface-100 py-2.5 pl-9 pr-3 text-sm text-ink-800 placeholder:text-ink-600/50 focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      <Select value={filters.type} onChange={(e) => onChange({ ...filters, type: e.target.value })} className="sm:w-40">
        <option value="">All types</option>
        {FOLLOWUP_TYPES.map((t) => (
          <option key={t} value={t}>
            {FOLLOWUP_TYPE_LABELS[t]}
          </option>
        ))}
      </Select>

      <Select value={filters.status} onChange={(e) => onChange({ ...filters, status: e.target.value })} className="sm:w-40">
        <option value="">All statuses</option>
        {FOLLOWUP_STATUSES.map((s) => (
          <option key={s} value={s}>
            {FOLLOWUP_STATUS_LABELS[s]}
          </option>
        ))}
      </Select>

      {hasActiveFilters && (
        <button
          type="button"
          onClick={clear}
          className="flex items-center gap-1 text-sm font-medium text-ink-600 hover:text-ink-800"
        >
          <X className="h-3.5 w-3.5" /> Clear
        </button>
      )}
    </div>
  );
};
