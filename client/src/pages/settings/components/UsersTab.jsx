import { useEffect, useState } from 'react';
import { Plus, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { Card } from '../../../components/ui/Card.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { Select } from '../../../components/ui/Select.jsx';
import { Table } from '../../../components/ui/Table.jsx';
import { Pagination } from '../../../components/ui/Pagination.jsx';
import { useApiQuery } from '../../../hooks/useApiQuery.js';
import { useDebounce } from '../../../hooks/useDebounce.js';
import { adminService } from '../../../services/adminService.js';
import { useAuth } from '../../../context/AuthContext.jsx';
import { ALL_ROLES, ROLE_LABELS } from '../../../utils/roles.js';
import { UserFormModal } from './UserFormModal.jsx';
import { formatRelativeTime } from '../../../utils/formatters.js';

const getInitials = (name = '') => name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();

export const UsersTab = () => {
  const { user: currentUser } = useAuth();
  const [q, setQ] = useState('');
  const [role, setRole] = useState('');
  const [isActive, setIsActive] = useState('');
  const [page, setPage] = useState(1);
  const [formState, setFormState] = useState({ isOpen: false, user: null });

  const debouncedQ = useDebounce(q, 400);

  useEffect(() => setPage(1), [debouncedQ, role, isActive]);

  const { data, isLoading, error, refetch } = useApiQuery(
    () => adminService.listUsers({ page, limit: 10, q: debouncedQ || undefined, role: role || undefined, isActive: isActive || undefined }),
    [page, debouncedQ, role, isActive]
  );

  const handleToggleActive = async (targetUser) => {
    try {
      await adminService.updateUser(targetUser._id, { isActive: !targetUser.isActive });
      toast.success(targetUser.isActive ? 'User deactivated' : 'User activated');
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update this user.');
    }
  };

  const columns = [
    {
      key: 'name',
      header: 'User',
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-500 text-xs font-semibold text-white">
            {getInitials(row.name)}
          </span>
          <div>
            <p className="font-medium text-ink-800">
              {row.name} {row._id === currentUser?.id && <span className="text-xs text-ink-600">(You)</span>}
            </p>
            <p className="text-xs text-ink-600">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      render: (row) => <span className="text-ink-800">{ROLE_LABELS[row.role]}</span>,
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (row) => (
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
            row.isActive ? 'bg-brand-50 text-brand-700' : 'bg-rose-50 text-rose-600'
          }`}
        >
          {row.isActive ? 'Active' : 'Deactivated'}
        </span>
      ),
    },
    {
      key: 'lastLoginAt',
      header: 'Last Login',
      render: (row) => (row.lastLoginAt ? formatRelativeTime(row.lastLoginAt) : 'Never'),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (row) => (
        <div className="flex justify-end gap-2">
          <Button variant="ghost" size="sm" onClick={() => setFormState({ isOpen: true, user: row })}>
            Edit
          </Button>
          {row._id !== currentUser?.id && (
            <Button
              variant="ghost"
              size="sm"
              className={row.isActive ? 'text-rose-600 hover:bg-rose-50' : 'text-brand-600 hover:bg-brand-50'}
              onClick={() => handleToggleActive(row)}
            >
              {row.isActive ? 'Deactivate' : 'Activate'}
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <Card>
      <div className="flex flex-col gap-3 border-b border-surface-300 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name or email…"
            className="min-w-[200px] flex-1 rounded-lg border border-surface-300 bg-surface-100 px-3.5 py-2 text-sm text-ink-800 placeholder:text-ink-600/50 focus:outline-none focus:ring-2 focus:ring-brand-500 sm:max-w-xs"
          />
          <Select value={role} onChange={(e) => setRole(e.target.value)} className="w-36">
            <option value="">All roles</option>
            {ALL_ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </Select>
          <Select value={isActive} onChange={(e) => setIsActive(e.target.value)} className="w-36">
            <option value="">All statuses</option>
            <option value="true">Active</option>
            <option value="false">Deactivated</option>
          </Select>
        </div>
        <Button onClick={() => setFormState({ isOpen: true, user: null })}>
          <Plus className="h-4 w-4" /> Create User
        </Button>
      </div>

      <Table
        columns={columns}
        rows={data?.items || []}
        isLoading={isLoading}
        error={error}
        onRetry={refetch}
        emptyProps={{ icon: Users, title: 'No users found', description: 'Try adjusting your search or filters.' }}
      />

      {data && (
        <Pagination page={data.meta.page} totalPages={data.meta.totalPages} total={data.meta.total} limit={data.meta.limit} onPageChange={setPage} />
      )}

      <UserFormModal
        isOpen={formState.isOpen}
        targetUser={formState.user}
        currentUserId={currentUser?.id}
        onClose={() => setFormState({ isOpen: false, user: null })}
        onSaved={refetch}
      />
    </Card>
  );
};
