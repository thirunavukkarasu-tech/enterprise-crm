import { useEffect, useState } from 'react';
import { ScrollText } from 'lucide-react';
import { Card, CardHeader } from '../../../components/ui/Card.jsx';
import { Select } from '../../../components/ui/Select.jsx';
import { Table } from '../../../components/ui/Table.jsx';
import { Pagination } from '../../../components/ui/Pagination.jsx';
import { useApiQuery } from '../../../hooks/useApiQuery.js';
import { adminService } from '../../../services/adminService.js';
import { formatDateTime } from '../../../utils/formatters.js';

const AUDIT_ACTIONS = [
  'user_created',
  'user_updated',
  'user_role_changed',
  'user_activated',
  'user_deactivated',
  'password_changed',
  'company_settings_updated',
  'login_success',
  'login_failed',
  'logout',
];

const actionLabel = (action) =>
  action
    .split('_')
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(' ');

const actionTone = (action) => {
  if (action.includes('failed') || action === 'user_deactivated') return 'bg-rose-50 text-rose-600';
  if (action.includes('created') || action === 'user_activated' || action === 'login_success') return 'bg-brand-50 text-brand-700';
  return 'bg-surface-200 text-ink-700';
};

export const AuditLogsTab = () => {
  const [action, setAction] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => setPage(1), [action]);

  const { data, isLoading, error, refetch } = useApiQuery(
    () => adminService.listAuditLogs({ page, limit: 20, action: action || undefined }),
    [page, action]
  );

  const columns = [
    {
      key: 'action',
      header: 'Action',
      render: (row) => (
        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${actionTone(row.action)}`}>
          {actionLabel(row.action)}
        </span>
      ),
    },
    { key: 'description', header: 'Description', render: (row) => <span className="text-ink-800">{row.description}</span> },
    { key: 'actor', header: 'Actor', render: (row) => row.actor?.name || row.actorEmail || 'System' },
    { key: 'ip', header: 'IP Address', render: (row) => row.ip || '—' },
    { key: 'createdAt', header: 'When', render: (row) => formatDateTime(row.createdAt) },
  ];

  return (
    <Card>
      <CardHeader
        title="Audit Logs"
        subtitle="Every administrative and security-relevant action"
        action={
          <Select value={action} onChange={(e) => setAction(e.target.value)} className="w-48">
            <option value="">All actions</option>
            {AUDIT_ACTIONS.map((a) => (
              <option key={a} value={a}>
                {actionLabel(a)}
              </option>
            ))}
          </Select>
        }
      />

      <Table
        columns={columns}
        rows={data?.items || []}
        isLoading={isLoading}
        error={error}
        onRetry={refetch}
        emptyProps={{ icon: ScrollText, title: 'No audit log entries', description: 'Administrative actions will appear here.' }}
      />

      {data && (
        <Pagination page={data.meta.page} totalPages={data.meta.totalPages} total={data.meta.total} limit={data.meta.limit} onPageChange={setPage} />
      )}
    </Card>
  );
};
