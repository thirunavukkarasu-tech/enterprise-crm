import { Search, X } from 'lucide-react';
import { Select } from '../../../components/ui/Select.jsx';
import { CUSTOMER_STATUSES, CUSTOMER_STATUS_LABELS } from '../../../utils/customerEnums.js';

export const CustomerFilters = ({ filters, onChange }) => {
  const hasActiveFilters = filters.q || filters.status || filters.tag;

  const clear = () => onChange({ q: '', status: '', tag: '' });

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
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
        className="sm:w-44"
      >
        <option value="">All statuses</option>
        {CUSTOMER_STATUSES.map((s) => (
          <option key={s} value={s}>
            {CUSTOMER_STATUS_LABELS[s]}
          </option>
        ))}
      </Select>

      <input
        value={filters.tag}
        onChange={(e) => onChange({ ...filters, tag: e.target.value })}
        placeholder="Filter by tag"
        className="rounded-lg border border-surface-300 bg-surface-100 px-3.5 py-2.5 text-sm text-ink-800 placeholder:text-ink-600/50 focus:outline-none focus:ring-2 focus:ring-brand-500 sm:w-40"
      />

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
