import { Search, X } from 'lucide-react';
import { Select } from '../../../components/ui/Select.jsx';
import {
  TASK_STATUSES,
  TASK_STATUS_LABELS,
  TASK_PRIORITIES,
  TASK_PRIORITY_LABELS,
  TASK_CATEGORIES,
  TASK_CATEGORY_LABELS,
} from '../../../utils/taskEnums.js';

export const TaskFilters = ({ filters, onChange }) => {
  const hasActiveFilters = filters.q || filters.status || filters.priority || filters.category;

  const clear = () => onChange({ q: '', status: '', priority: '', category: '' });

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      <div className="relative flex-1 sm:max-w-xs">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-600/50" />
        <input
          type="search"
          value={filters.q}
          onChange={(e) => onChange({ ...filters, q: e.target.value })}
          placeholder="Search tasks…"
          className="w-full rounded-lg border border-surface-300 bg-surface-100 py-2.5 pl-9 pr-3 text-sm text-ink-800 placeholder:text-ink-600/50 focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      <Select value={filters.status} onChange={(e) => onChange({ ...filters, status: e.target.value })} className="sm:w-40">
        <option value="">All statuses</option>
        {TASK_STATUSES.map((s) => (
          <option key={s} value={s}>
            {TASK_STATUS_LABELS[s]}
          </option>
        ))}
      </Select>

      <Select value={filters.priority} onChange={(e) => onChange({ ...filters, priority: e.target.value })} className="sm:w-36">
        <option value="">All priorities</option>
        {TASK_PRIORITIES.map((p) => (
          <option key={p} value={p}>
            {TASK_PRIORITY_LABELS[p]}
          </option>
        ))}
      </Select>

      <Select value={filters.category} onChange={(e) => onChange({ ...filters, category: e.target.value })} className="sm:w-40">
        <option value="">All categories</option>
        {TASK_CATEGORIES.map((c) => (
          <option key={c} value={c}>
            {TASK_CATEGORY_LABELS[c]}
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
