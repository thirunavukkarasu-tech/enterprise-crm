import { useEffect, useState } from 'react';
import { LogIn, CheckCircle2, XCircle } from 'lucide-react';
import { Card, CardHeader } from '../../../components/ui/Card.jsx';
import { Table } from '../../../components/ui/Table.jsx';
import { Pagination } from '../../../components/ui/Pagination.jsx';
import { useApiQuery } from '../../../hooks/useApiQuery.js';
import { adminService } from '../../../services/adminService.js';
import { formatDateTime } from '../../../utils/formatters.js';

/**
 * Same underlying AuditLog collection as AuditLogsTab, pre-filtered to
 * login/logout events server-side (`GET /admin/login-history` — see
 * server/src/services/audit.service.js#listLoginHistory) rather than this
 * component filtering a broader result client-side.
 */
export const LoginHistoryTab = () => {
  const [page, setPage] = useState(1);

  useEffect(() => setPage(1), []);

  const { data, isLoading, error, refetch } = useApiQuery(
    () => adminService.listLoginHistory({ page, limit: 20 }),
    [page]
  );

  const columns = [
    {
      key: 'action',
      header: 'Event',
      render: (row) =>
        row.action === 'login_success' ? (
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-700">
            <CheckCircle2 className="h-4 w-4" /> Login succeeded
          </span>
        ) : row.action === 'login_failed' ? (
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-rose-600">
            <XCircle className="h-4 w-4" /> Login failed
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-700">
            <LogIn className="h-4 w-4" /> Logout
          </span>
        ),
    },
    { key: 'actor', header: 'User', render: (row) => row.actor?.name || row.actorEmail || 'Unknown' },
    { key: 'ip', header: 'IP Address', render: (row) => row.ip || '—' },
    {
      key: 'userAgent',
      header: 'Device / Browser',
      render: (row) => <span className="line-clamp-1 max-w-[220px] text-xs text-ink-600">{row.userAgent || '—'}</span>,
    },
    { key: 'createdAt', header: 'When', render: (row) => formatDateTime(row.createdAt) },
  ];

  return (
    <Card>
      <CardHeader title="Login History" subtitle="Successful and failed sign-in attempts across the organization" />

      <Table
        columns={columns}
        rows={data?.items || []}
        isLoading={isLoading}
        error={error}
        onRetry={refetch}
        emptyProps={{ icon: LogIn, title: 'No login activity yet', description: 'Sign-in attempts will appear here.' }}
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
  );
};
