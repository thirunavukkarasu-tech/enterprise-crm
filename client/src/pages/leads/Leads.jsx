import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Target } from 'lucide-react';
import toast from 'react-hot-toast';
import { useApiQuery } from '../../hooks/useApiQuery.js';
import { useDebounce } from '../../hooks/useDebounce.js';
import { leadService } from '../../services/leadService.js';
import { Card } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Table } from '../../components/ui/Table.jsx';
import { Pagination } from '../../components/ui/Pagination.jsx';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog.jsx';
import { LeadFilters } from './components/LeadFilters.jsx';
import { LeadFormModal } from './components/LeadFormModal.jsx';
import { LeadStatusBadge } from './components/LeadStatusBadge.jsx';
import { PriorityBadge } from './components/PriorityBadge.jsx';
import { LEAD_SOURCE_LABELS } from '../../utils/leadEnums.js';
import { formatCurrency } from '../../utils/formatters.js';

const DEFAULT_FILTERS = { q: '', status: '', source: '', priority: '' };

export default function Leads() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState({ sortBy: 'createdAt', sortOrder: 'desc' });
  const [formState, setFormState] = useState({ isOpen: false, lead: null });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const debouncedQ = useDebounce(filters.q, 400);
  const limit = 10;

  // Deep-linked "Add Lead" from the dashboard's Quick Actions.
  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setFormState({ isOpen: true, lead: null });
      searchParams.delete('new');
      setSearchParams(searchParams, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setPage(1);
  }, [debouncedQ, filters.status, filters.source, filters.priority, sort.sortBy, sort.sortOrder]);

  const queryParams = {
    page,
    limit,
    q: debouncedQ || undefined,
    status: filters.status || undefined,
    source: filters.source || undefined,
    priority: filters.priority || undefined,
    ...sort,
  };

  const { data, isLoading, error, refetch } = useApiQuery(
    () => leadService.list(queryParams),
    [page, debouncedQ, filters.status, filters.source, filters.priority, sort.sortBy, sort.sortOrder]
  );

  const handleSortChange = useCallback((sortBy, sortOrder) => {
    setSort({ sortBy, sortOrder });
  }, []);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await leadService.remove(deleteTarget._id);
      toast.success('Lead deleted');
      setDeleteTarget(null);
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not delete this lead.');
    } finally {
      setIsDeleting(false);
    }
  };

  const columns = [
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      render: (row) => (
        <div>
          <p className="font-medium text-ink-800">{row.name}</p>
          <p className="text-xs text-ink-600">{row.email || row.company || '—'}</p>
        </div>
      ),
    },
    { key: 'company', header: 'Company', sortable: true, render: (row) => row.company || '—' },
    { key: 'status', header: 'Status', sortable: true, render: (row) => <LeadStatusBadge status={row.status} /> },
    { key: 'priority', header: 'Priority', sortable: true, render: (row) => <PriorityBadge priority={row.priority} /> },
    { key: 'source', header: 'Source', render: (row) => LEAD_SOURCE_LABELS[row.source] },
    {
      key: 'estimatedValue',
      header: 'Est. Value',
      sortable: true,
      align: 'right',
      render: (row) => formatCurrency(row.estimatedValue),
    },
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
              setFormState({ isOpen: true, lead: row });
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
          <h1 className="font-display text-2xl font-semibold text-ink">Leads</h1>
          <p className="mt-1 text-sm text-ink-600">Track and convert prospects into customers.</p>
        </div>
        <Button onClick={() => setFormState({ isOpen: true, lead: null })}>
          <Plus className="h-4 w-4" /> Add Lead
        </Button>
      </div>

      <Card>
        <div className="border-b border-surface-300 px-5 py-4">
          <LeadFilters filters={filters} onChange={setFilters} />
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
          onRowClick={(row) => navigate(`/leads/${row._id}`)}
          emptyProps={{
            icon: Target,
            title:
              filters.q || filters.status || filters.source || filters.priority
                ? 'No matching leads'
                : 'No leads yet',
            description:
              filters.q || filters.status || filters.source || filters.priority
                ? 'Try adjusting your search or filters.'
                : 'Add your first lead to get started.',
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

      <LeadFormModal
        isOpen={formState.isOpen}
        lead={formState.lead}
        onClose={() => setFormState({ isOpen: false, lead: null })}
        onSaved={refetch}
      />

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        title="Delete lead"
        confirmLabel="Delete"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? This can be restored by an administrator later.`}
      />
    </div>
  );
}
