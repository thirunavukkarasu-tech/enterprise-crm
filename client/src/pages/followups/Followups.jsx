import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, PhoneCall, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useApiQuery } from '../../hooks/useApiQuery.js';
import { useDebounce } from '../../hooks/useDebounce.js';
import { followUpService } from '../../services/followUpService.js';
import { Card } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Table } from '../../components/ui/Table.jsx';
import { Pagination } from '../../components/ui/Pagination.jsx';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog.jsx';
import { FollowUpFilters } from './components/FollowUpFilters.jsx';
import { FollowUpFormModal } from './components/FollowUpFormModal.jsx';
import { FollowUpTypeBadge } from './components/FollowUpTypeBadge.jsx';
import { FollowUpStatusBadge } from './components/FollowUpStatusBadge.jsx';
import { formatDateTime } from '../../utils/formatters.js';

const DEFAULT_FILTERS = { q: '', type: '', status: '' };

export default function Followups() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState({ sortBy: 'scheduledAt', sortOrder: 'asc' });
  const [formState, setFormState] = useState({ isOpen: false, followUp: null });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [completingId, setCompletingId] = useState(null);

  const debouncedQ = useDebounce(filters.q, 400);
  const limit = 10;

  // Deep-linked "Log Follow-up" from the dashboard's Quick Actions.
  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setFormState({ isOpen: true, followUp: null });
      searchParams.delete('new');
      setSearchParams(searchParams, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setPage(1);
  }, [debouncedQ, filters.type, filters.status, sort.sortBy, sort.sortOrder]);

  const queryParams = {
    page,
    limit,
    q: debouncedQ || undefined,
    type: filters.type || undefined,
    status: filters.status || undefined,
    ...sort,
  };

  const { data, isLoading, error, refetch } = useApiQuery(
    () => followUpService.list(queryParams),
    [page, debouncedQ, filters.type, filters.status, sort.sortBy, sort.sortOrder]
  );

  const handleSortChange = useCallback((sortBy, sortOrder) => {
    setSort({ sortBy, sortOrder });
  }, []);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await followUpService.remove(deleteTarget._id);
      toast.success('Follow-up removed');
      setDeleteTarget(null);
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not remove this follow-up.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleMarkCompleted = async (followUp, e) => {
    e.stopPropagation();
    setCompletingId(followUp._id);
    try {
      await followUpService.update(followUp._id, { status: 'completed' });
      toast.success('Marked as completed');
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update this follow-up.');
    } finally {
      setCompletingId(null);
    }
  };

  const columns = [
    { key: 'type', header: 'Type', render: (row) => <FollowUpTypeBadge type={row.type} /> },
    {
      key: 'subject',
      header: 'Subject',
      sortable: true,
      render: (row) => (
        <div>
          <p className="font-medium text-ink-800">{row.subject}</p>
          {row.relatedCustomer && <p className="text-xs text-ink-600">{row.relatedCustomer.name}</p>}
        </div>
      ),
    },
    {
      key: 'scheduledAt',
      header: 'Scheduled',
      sortable: true,
      render: (row) => {
        const isOverdue = row.status === 'scheduled' && new Date(row.scheduledAt) < new Date();
        return (
          <span className={isOverdue ? 'font-medium text-rose-600' : 'text-ink-800'}>
            {formatDateTime(row.scheduledAt)}
          </span>
        );
      },
    },
    { key: 'status', header: 'Status', sortable: true, render: (row) => <FollowUpStatusBadge status={row.status} /> },
    { key: 'assignedTo', header: 'Owner', render: (row) => row.assignedTo?.name || '—' },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (row) => (
        <div className="flex justify-end gap-2">
          {row.status === 'scheduled' && (
            <Button
              variant="ghost"
              size="sm"
              className="text-brand-600 hover:bg-brand-50"
              isLoading={completingId === row._id}
              onClick={(e) => handleMarkCompleted(row, e)}
            >
              <CheckCircle2 className="h-4 w-4" /> Complete
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setFormState({ isOpen: true, followUp: row });
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
          <h1 className="font-display text-2xl font-semibold text-ink">Follow-ups</h1>
          <p className="mt-1 text-sm text-ink-600">Calls, meetings, and email follow-ups across your accounts.</p>
        </div>
        <Button onClick={() => setFormState({ isOpen: true, followUp: null })}>
          <Plus className="h-4 w-4" /> Schedule Follow-up
        </Button>
      </div>

      <Card>
        <div className="border-b border-surface-300 px-5 py-4">
          <FollowUpFilters filters={filters} onChange={setFilters} />
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
          onRowClick={(row) => setFormState({ isOpen: true, followUp: row })}
          emptyProps={{
            icon: PhoneCall,
            title: filters.q || filters.type || filters.status ? 'No matching follow-ups' : 'No follow-ups yet',
            description:
              filters.q || filters.type || filters.status
                ? 'Try adjusting your search or filters.'
                : 'Schedule a call, meeting, or email to get started.',
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

      <FollowUpFormModal
        isOpen={formState.isOpen}
        followUp={formState.followUp}
        onClose={() => setFormState({ isOpen: false, followUp: null })}
        onSaved={refetch}
      />

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        title="Remove follow-up"
        confirmLabel="Remove"
        description={`Remove the scheduled ${deleteTarget?.type} "${deleteTarget?.subject}"? This can be restored by an administrator later.`}
      />
    </div>
  );
}
