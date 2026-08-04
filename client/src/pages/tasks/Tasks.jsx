import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, CheckSquare, Circle, CheckCircle2 } from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import { useApiQuery } from '../../hooks/useApiQuery.js';
import { useDebounce } from '../../hooks/useDebounce.js';
import { taskService } from '../../services/taskService.js';
import { Card } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Table } from '../../components/ui/Table.jsx';
import { Pagination } from '../../components/ui/Pagination.jsx';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog.jsx';
import { TaskFilters } from './components/TaskFilters.jsx';
import { TaskFormModal } from './components/TaskFormModal.jsx';
import { TaskStatusBadge } from './components/TaskStatusBadge.jsx';
import { TaskPriorityBadge } from './components/TaskPriorityBadge.jsx';
import { TASK_CATEGORY_LABELS } from '../../utils/taskEnums.js';
import { formatDueDate } from '../../utils/formatters.js';

const DEFAULT_FILTERS = { q: '', status: '', priority: '', category: '' };

export default function Tasks() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState({ sortBy: 'dueDate', sortOrder: 'asc' });
  const [formState, setFormState] = useState({ isOpen: false, task: null });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [togglingId, setTogglingId] = useState(null);

  const debouncedQ = useDebounce(filters.q, 400);
  const limit = 10;

  // Deep-linked "Create Task" from the dashboard's Quick Actions.
  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setFormState({ isOpen: true, task: null });
      searchParams.delete('new');
      setSearchParams(searchParams, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setPage(1);
  }, [debouncedQ, filters.status, filters.priority, filters.category, sort.sortBy, sort.sortOrder]);

  const queryParams = {
    page,
    limit,
    q: debouncedQ || undefined,
    status: filters.status || undefined,
    priority: filters.priority || undefined,
    category: filters.category || undefined,
    ...sort,
  };

  const { data, isLoading, error, refetch } = useApiQuery(
    () => taskService.list(queryParams),
    [page, debouncedQ, filters.status, filters.priority, filters.category, sort.sortBy, sort.sortOrder]
  );

  const handleSortChange = useCallback((sortBy, sortOrder) => {
    setSort({ sortBy, sortOrder });
  }, []);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await taskService.remove(deleteTarget._id);
      toast.success('Task deleted');
      setDeleteTarget(null);
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not delete this task.');
    } finally {
      setIsDeleting(false);
    }
  };

  /** One-click complete/reopen toggle, right from the list — the most common action on a task row. */
  const handleToggleComplete = async (task, e) => {
    e.stopPropagation();
    setTogglingId(task._id);
    try {
      await taskService.update(task._id, { status: task.status === 'completed' ? 'pending' : 'completed' });
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update this task.');
    } finally {
      setTogglingId(null);
    }
  };

  const columns = [
    {
      key: 'complete',
      header: '',
      width: '36px',
      render: (row) => (
        <button
          type="button"
          onClick={(e) => handleToggleComplete(row, e)}
          disabled={togglingId === row._id}
          aria-label={row.status === 'completed' ? 'Mark as pending' : 'Mark as completed'}
          className="text-ink-600 hover:text-brand-600 disabled:opacity-50"
        >
          {row.status === 'completed' ? (
            <CheckCircle2 className="h-5 w-5 text-brand-500" />
          ) : (
            <Circle className="h-5 w-5" />
          )}
        </button>
      ),
    },
    {
      key: 'title',
      header: 'Task',
      sortable: true,
      render: (row) => (
        <div>
          <p className={clsx('font-medium', row.status === 'completed' ? 'text-ink-600 line-through' : 'text-ink-800')}>
            {row.title}
          </p>
          <p className="text-xs text-ink-600">{TASK_CATEGORY_LABELS[row.category]}</p>
        </div>
      ),
    },
    {
      key: 'dueDate',
      header: 'Due',
      sortable: true,
      render: (row) => {
        const overdue = new Date(row.dueDate) < new Date() && row.status !== 'completed' && row.status !== 'cancelled';
        return <span className={overdue ? 'font-medium text-rose-600' : 'text-ink-800'}>{formatDueDate(row.dueDate)}</span>;
      },
    },
    { key: 'priority', header: 'Priority', sortable: true, render: (row) => <TaskPriorityBadge priority={row.priority} /> },
    { key: 'status', header: 'Status', sortable: true, render: (row) => <TaskStatusBadge status={row.status} /> },
    { key: 'assignedTo', header: 'Owner', render: (row) => row.assignedTo?.name || '—' },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (row) => (
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setFormState({ isOpen: true, task: row });
            }}
          >
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-rose-600 hover:bg-rose-50"
            onClick={(e) => {
              e.stopPropagation();
              setDeleteTarget(row);
            }}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Tasks</h1>
          <p className="mt-1 text-sm text-ink-600">Stay on top of what's due across your accounts.</p>
        </div>
        <Button onClick={() => setFormState({ isOpen: true, task: null })}>
          <Plus className="h-4 w-4" /> Create Task
        </Button>
      </div>

      <Card>
        <div className="border-b border-surface-300 px-5 py-4">
          <TaskFilters filters={filters} onChange={setFilters} />
        </div>

        <Table
          columns={columns}
          rows={data?.items || []}
          isLoading={isLoading}
          error={error}
          onRetry={refetch}
          sortBy={sort.sortBy}
          sortOrder={sort.sortOrder}
          onSortChange={handleSortChange}
          onRowClick={(row) => navigate(`/tasks/${row._id}`)}
          emptyProps={{
            icon: CheckSquare,
            title:
              filters.q || filters.status || filters.priority || filters.category
                ? 'No matching tasks'
                : 'No tasks yet',
            description:
              filters.q || filters.status || filters.priority || filters.category
                ? 'Try adjusting your search or filters.'
                : 'Create your first task to get started.',
          }}
        />

        {data && (
          <Pagination
            page={data.meta.page}
            totalPages={data.meta.totalPages}
            total={data.meta.total}
            limit={data.meta.limit}
            onPageChange={setPage}
          />
        )}
      </Card>

      <TaskFormModal
        isOpen={formState.isOpen}
        task={formState.task}
        onClose={() => setFormState({ isOpen: false, task: null })}
        onSaved={refetch}
      />

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        title="Delete task"
        confirmLabel="Delete"
        description={`Are you sure you want to delete "${deleteTarget?.title}"? This can be restored by an administrator later.`}
      />
    </div>
  );
}
