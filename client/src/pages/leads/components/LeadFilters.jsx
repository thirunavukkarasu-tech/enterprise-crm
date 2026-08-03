import { Search, X } from 'lucide-react';
import { Select } from '../../../components/ui/Select.jsx';
import { LEAD_STATUSES, LEAD_STATUS_LABELS, LEAD_SOURCES, LEAD_SOURCE_LABELS, LEAD_PRIORITIES, LEAD_PRIORITY_LABELS } from '../../../utils/leadEnums.js';

export const LeadFilters = ({ filters, onChange }) => {
  const hasActiveFilters = filters.q || filters.status || filters.source || filters.priority;

  const clear = () => onChange({ q: '', status: '', source: '', priority: '' });

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      <div className="relative flex-1 sm:max-w-xs">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-600/50" />
        <input
          type="search"
          value={filters.q}
          onChange={(e) => onChange({ ...filters, q: e.target.value })}
          placeholder="Search name, email, company…"
          className="w-full rounded-lg border border-surface-300 bg-surface-100 py-2.5 pl-9 pr-3 text-sm text-ink-800 placeholder:text-ink-600/50 focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      <Select
        value={filters.status}
        onChange={(e) => onChange({ ...filters, status: e.target.value })}
        className="sm:w-40"
      >
        <option value="">All statuses</option>
        {LEAD_STATUSES.map((s) => (
          <option key={s} value={s}>
            {LEAD_STATUS_LABELS[s]}
          </option>
        ))}
      </Select>

      <Select
        value={filters.source}
        onChange={(e) => onChange({ ...filters, source: e.target.value })}
        className="sm:w-40"
      >
        <option value="">All sources</option>
        {LEAD_SOURCES.map((s) => (
          <option key={s} value={s}>
            {LEAD_SOURCE_LABELS[s]}
          </option>
        ))}
      </Select>

      <Select
        value={filters.priority}
        onChange={(e) => onChange({ ...filters, priority: e.target.value })}
        className="sm:w-36"
      >
        <option value="">All priorities</option>
        {LEAD_PRIORITIES.map((p) => (
          <option key={p} value={p}>
            {LEAD_PRIORITY_LABELS[p]}
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
