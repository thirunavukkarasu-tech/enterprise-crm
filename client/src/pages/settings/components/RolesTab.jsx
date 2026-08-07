import { Check, Minus } from 'lucide-react';
import { Card, CardHeader } from '../../../components/ui/Card.jsx';
import { ROLE_LABELS } from '../../../utils/roles.js';

/**
 * This app uses coarse-grained, role-based access control (four fixed
 * roles — see docs/ARCHITECTURE.md §4) rather than a granular per-
 * permission system (e.g. "can_delete_customer" toggles per user). This
 * tab is therefore a read-only reference of what each role can already
 * do, not an editor — there's nothing to "save" here. Building a dynamic
 * permission-matrix editor would be a meaningfully different
 * authorization model (checked in `authorize()` on every route) and is
 * flagged as a natural extension point rather than half-implemented here.
 */
const CAPABILITIES = [
  { label: 'View own customers, leads, tasks', admin: true, hr: true, manager: true, employee: true },
  { label: 'View org-wide records (all reps)', admin: true, hr: true, manager: true, employee: false },
  { label: 'Reassign records to other reps', admin: true, hr: true, manager: true, employee: false },
  { label: 'View sales performance & team productivity', admin: true, hr: true, manager: true, employee: false },
  { label: 'View top-performers leaderboard', admin: true, hr: true, manager: true, employee: false },
  { label: 'Export reports (CSV/Excel)', admin: true, hr: true, manager: true, employee: true },
  { label: 'Manage company settings', admin: true, hr: false, manager: false, employee: false },
  { label: 'Manage users & roles', admin: true, hr: false, manager: false, employee: false },
  { label: 'View audit logs & login history', admin: true, hr: false, manager: false, employee: false },
];

const ROLE_KEYS = ['admin', 'hr', 'manager', 'employee'];

export const RolesTab = () => (
  <Card>
    <CardHeader title="Roles & Permissions" subtitle="What each role can do — enforced server-side on every request" />
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-surface-300 text-xs font-semibold uppercase tracking-wide text-ink-600">
            <th className="px-5 py-3">Capability</th>
            {ROLE_KEYS.map((r) => (
              <th key={r} className="px-5 py-3 text-center">
                {ROLE_LABELS[r]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {CAPABILITIES.map((cap) => (
            <tr key={cap.label} className="border-b border-surface-300 last:border-0">
              <td className="px-5 py-3 text-ink-800">{cap.label}</td>
              {ROLE_KEYS.map((r) => (
                <td key={r} className="px-5 py-3 text-center">
                  {cap[r] ? (
                    <Check className="mx-auto h-4 w-4 text-brand-600" aria-label="Yes" />
                  ) : (
                    <Minus className="mx-auto h-4 w-4 text-ink-600/40" aria-label="No" />
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </Card>
);
