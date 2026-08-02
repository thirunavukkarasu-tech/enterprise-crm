import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { useApiQuery } from '../../hooks/useApiQuery.js';
import { useDebounce } from '../../hooks/useDebounce.js';
import { customerService } from '../../services/customerService.js';
import { Card } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Table } from '../../components/ui/Table.jsx';
import { Pagination } from '../../components/ui/Pagination.jsx';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog.jsx';
import { CustomerFilters } from './components/CustomerFilters.jsx';
import { CustomerFormModal } from './components/CustomerFormModal.jsx';
import { ImportExportMenu } from './components/ImportExportMenu.jsx';
import { StatusBadge } from './components/StatusBadge.jsx';
import { TagList } from './components/TagList.jsx';

const DEFAULT_FILTERS = { q: '', status: '', tag: '' };

export default function Customers() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState({ sortBy: 'createdAt', sortOrder: 'desc' });
  const [formState, setFormState] = useState({ isOpen: false, customer: null });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const debouncedQ = useDebounce(filters.q, 400);
  const limit = 10;

  // Deep-linked "Add Customer" from the dashboard's Quick Actions.
  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setFormState({ isOpen: true, customer: null });
      searchParams.delete('new');
      setSearchParams(searchParams, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reset to page 1 whenever the filters or sort change so the user isn't
  // stranded on a page that no longer has results.
  useEffect(() => {
    setPage(1);
  }, [debouncedQ, filters.status, filters.tag, sort.sortBy, sort.sortOrder]);

  const queryParams = {
    page,
    limit,
    q: debouncedQ || undefined,
    status: filters.status || undefined,
    tag: filters.tag || undefined,
    ...sort,
  };

  const { data, isLoading, error, refetch } = useApiQuery(
    () => customerService.list(queryParams),
    [page, debouncedQ, filters.status, filters.tag, sort.sortBy, sort.sortOrder]
  );

  const handleSortChange = useCallback((sortBy, sortOrder) => {
    setSort({ sortBy, sortOrder });
  }, []);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await customerService.remove(deleteTarget._id);
      toast.success('Customer deleted');
      setDeleteTarget(null);
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not delete this customer.');
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
          <p className="text-xs text-ink-600">{row.email}</p>
        </div>
      ),
    },
    { key: 'company', header: 'Company', sortable: true, render: (row) => row.company || '—' },
    { key: 'status', header: 'Status', sortable: true, render: (row) => <StatusBadge status={row.status} /> },
    { key: 'tags', header: 'Tags', render: (row) => <TagList tags={row.tags} /> },
    {
      key: 'assignedTo',
      header: 'Owner',
      render: (row) => row.assignedTo?.name || '—',
    },
    {
      key: 'createdAt',
      header: 'Added',
      sortable: true,
      render: (row) => new Date(row.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    },
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
              setFormState({ isOpen: true, customer: row });
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
          <h1 className="font-display text-2xl font-semibold text-ink">Customers</h1>
          <p className="mt-1 text-sm text-ink-600">Manage your customer relationships in one place.</p>
        </div>
        <div className="flex items-center gap-2">
          <ImportExportMenu filters={filters} onImported={refetch} />
          <Button onClick={() => setFormState({ isOpen: true, customer: null })}>
            <Plus className="h-4 w-4" /> Add Customer
          </Button>
        </div>
      </div>

      <Card>
        <div className="border-b border-surface-300 px-5 py-4">
          <CustomerFilters filters={filters} onChange={setFilters} />
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
          onRowClick={(row) => navigate(`/customers/${row._id}`)}
          emptyProps={{
            icon: Users,
            title: filters.q || filters.status || filters.tag ? 'No matching customers' : 'No customers yet',
            description:
              filters.q || filters.status || filters.tag
                ? 'Try adjusting your search or filters.'
                : 'Add your first customer to get started.',
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

      <CustomerFormModal
        isOpen={formState.isOpen}
        customer={formState.customer}
        onClose={() => setFormState({ isOpen: false, customer: null })}
        onSaved={refetch}
      />

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        title="Delete customer"
        confirmLabel="Delete"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? This can be restored by an administrator later.`}
      />
    </div>
  );
}
