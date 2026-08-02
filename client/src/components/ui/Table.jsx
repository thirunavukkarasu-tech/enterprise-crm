import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import clsx from 'clsx';
import { EmptyState } from '../common/EmptyState.jsx';
import { ErrorState } from '../common/ErrorState.jsx';

/**
 * Generic data table driven entirely by a `columns` config, so any future
 * module (Leads, Tasks, Reports...) reuses this instead of hand-rolling a
 * new <table> each time. A column looks like:
 *   { key, header, render?(row), sortable?, align?, width? }
 * `render` defaults to `row[key]` when omitted.
 *
 * Sorting is controlled by the parent (sortBy/sortOrder + onSortChange) —
 * this component only renders the affordance and reports intent, since the
 * actual sort usually needs to hit the server for paginated data.
 */
export const Table = ({
  columns,
  rows,
  keyField = '_id',
  isLoading,
  error,
  onRetry,
  emptyProps,
  sortBy,
  sortOrder,
  onSortChange,
  onRowClick,
  skeletonRows = 6,
}) => {
  const handleSort = (col) => {
    if (!col.sortable || !onSortChange) return;
    if (sortBy !== col.key) {
      onSortChange(col.key, 'desc');
    } else {
      onSortChange(col.key, sortOrder === 'asc' ? 'desc' : 'asc');
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-surface-300">
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                style={{ width: col.width }}
                className={clsx(
                  'whitespace-nowrap px-5 py-3 text-xs font-semibold uppercase tracking-wide text-ink-600',
                  col.align === 'right' && 'text-right'
                )}
              >
                {col.sortable ? (
                  <button
                    type="button"
                    onClick={() => handleSort(col)}
                    className="inline-flex items-center gap-1 hover:text-ink-800"
                  >
                    {col.header}
                    {sortBy === col.key ? (
                      sortOrder === 'asc' ? (
                        <ArrowUp className="h-3 w-3" />
                      ) : (
                        <ArrowDown className="h-3 w-3" />
                      )
                    ) : (
                      <ArrowUpDown className="h-3 w-3 opacity-40" />
                    )}
                  </button>
                ) : (
                  col.header
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {isLoading &&
            Array.from({ length: skeletonRows }).map((_, i) => (
              <tr key={i} className="border-b border-surface-300">
                {columns.map((col) => (
                  <td key={col.key} className="px-5 py-4">
                    <div className="h-3.5 w-4/5 animate-pulse rounded bg-surface-300/70" />
                  </td>
                ))}
              </tr>
            ))}

          {!isLoading && error && (
            <tr>
              <td colSpan={columns.length}>
                <ErrorState message="Couldn't load this data." onRetry={onRetry} />
              </td>
            </tr>
          )}

          {!isLoading && !error && rows.length === 0 && (
            <tr>
              <td colSpan={columns.length}>
                <EmptyState {...emptyProps} />
              </td>
            </tr>
          )}

          {!isLoading &&
            !error &&
            rows.map((row) => (
              <tr
                key={row[keyField]}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={clsx(
                  'border-b border-surface-300 last:border-0',
                  onRowClick && 'cursor-pointer hover:bg-surface-200/60'
                )}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={clsx('px-5 py-4 text-ink-800', col.align === 'right' && 'text-right')}
                  >
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
};
