import { useState } from 'react';
import { Plus, PhoneCall } from 'lucide-react';
import { useApiQuery } from '../../../hooks/useApiQuery.js';
import { followUpService } from '../../../services/followUpService.js';
import { Button } from '../../../components/ui/Button.jsx';
import { ListSkeleton } from '../../../components/common/Skeleton.jsx';
import { ErrorState } from '../../../components/common/ErrorState.jsx';
import { EmptyState } from '../../../components/common/EmptyState.jsx';
import { FollowUpTypeBadge } from '../../followups/components/FollowUpTypeBadge.jsx';
import { FollowUpStatusBadge } from '../../followups/components/FollowUpStatusBadge.jsx';
import { FollowUpFormModal } from '../../followups/components/FollowUpFormModal.jsx';
import { formatDateTime } from '../../../utils/formatters.js';

/**
 * Powers the "Customer Interaction History" requirement — every call,
 * meeting, and email follow-up logged against this customer, newest
 * first, reusing `GET /followups/customer/:customerId` (see
 * server/src/services/followup.service.js#getFollowUpsForCustomer).
 */
export const CustomerInteractionHistory = ({ customerId }) => {
  const { data, isLoading, error, refetch } = useApiQuery(
    () => followUpService.getCustomerHistory(customerId),
    [customerId]
  );
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);

  return (
    <>
      <div className="flex items-center justify-between px-5 pt-5">
        <Button size="sm" variant="secondary" onClick={() => setIsScheduleOpen(true)}>
          <Plus className="h-4 w-4" /> Schedule Follow-up
        </Button>
      </div>

      <div className="px-5 pb-5 pt-3">
        {isLoading && <ListSkeleton rows={4} />}
        {error && <ErrorState message="Couldn't load interaction history." onRetry={refetch} />}
        {!isLoading && !error && data?.length === 0 && (
          <EmptyState
            icon={PhoneCall}
            title="No interactions yet"
            description="Calls, meetings, and email follow-ups with this customer will show up here."
          />
        )}
        {!isLoading && !error && data?.length > 0 && (
          <ul className="space-y-4">
            {data.map((f) => (
              <li key={f._id} className="flex items-start justify-between gap-3 rounded-lg bg-surface-200/60 px-3.5 py-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <FollowUpTypeBadge type={f.type} />
                    <FollowUpStatusBadge status={f.status} />
                  </div>
                  <p className="mt-1 text-sm font-medium text-ink-800">{f.subject}</p>
                  <p className="mt-0.5 text-xs text-ink-600">
                    {formatDateTime(f.scheduledAt)} · {f.assignedTo?.name || 'Unassigned'}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <FollowUpFormModal
        isOpen={isScheduleOpen}
        followUp={null}
        defaultCustomerId={customerId}
        onClose={() => setIsScheduleOpen(false)}
        onSaved={refetch}
      />
    </>
  );
};
