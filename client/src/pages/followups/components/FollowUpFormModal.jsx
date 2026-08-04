import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Modal } from '../../../components/ui/Modal.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { Input } from '../../../components/ui/Input.jsx';
import { Select } from '../../../components/ui/Select.jsx';
import { TextArea } from '../../../components/ui/TextArea.jsx';
import {
  FOLLOWUP_TYPES,
  FOLLOWUP_TYPE_LABELS,
  FOLLOWUP_STATUSES,
  FOLLOWUP_STATUS_LABELS,
} from '../../../utils/followupEnums.js';
import { followUpService } from '../../../services/followUpService.js';
import { customerService } from '../../../services/customerService.js';
import { useApiQuery } from '../../../hooks/useApiQuery.js';
import { useAssignableUsers } from '../../../hooks/useAssignableUsers.js';
import { ROLE_LABELS } from '../../../utils/roles.js';

/** Converts an ISO date string to the `datetime-local` input format. */
const toDatetimeLocal = (isoString) => {
  if (!isoString) return '';
  const d = new Date(isoString);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const emptyDefaults = {
  type: 'call',
  subject: '',
  notes: '',
  scheduledAt: '',
  durationMinutes: '30',
  status: 'scheduled',
  relatedCustomer: '',
  assignedTo: '',
  reminderAt: '',
};

/**
 * `followUp` prop present → edit mode; absent → create mode.
 * `defaultCustomerId` locks the customer picker when opened from a
 * customer's own detail page ("Schedule Follow-up" in Interaction History).
 */
export const FollowUpFormModal = ({ isOpen, onClose, followUp, defaultCustomerId, onSaved }) => {
  const isEdit = Boolean(followUp);
  const [serverError, setServerError] = useState('');

  const { data: customerOptions } = useApiQuery(
    () => customerService.list({ limit: 50, sortBy: 'createdAt', sortOrder: 'desc' }),
    []
  );
  const { data: assignableUsers, canAssign } = useAssignableUsers();

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: emptyDefaults });

  const type = watch('type');

  useEffect(() => {
    if (isOpen) {
      reset(
        followUp
          ? {
              type: followUp.type,
              subject: followUp.subject,
              notes: followUp.notes || '',
              scheduledAt: toDatetimeLocal(followUp.scheduledAt),
              durationMinutes: followUp.durationMinutes ?? '',
              status: followUp.status,
              relatedCustomer: followUp.relatedCustomer?._id || '',
              assignedTo: followUp.assignedTo?._id || '',
              reminderAt: toDatetimeLocal(followUp.reminderAt),
            }
          : { ...emptyDefaults, relatedCustomer: defaultCustomerId || '' }
      );
      setServerError('');
    }
  }, [isOpen, followUp, defaultCustomerId, reset]);

  const onSubmit = async (values) => {
    setServerError('');
    const payload = {
      ...values,
      durationMinutes: values.type === 'email' || values.durationMinutes === '' ? undefined : Number(values.durationMinutes),
      assignedTo: values.assignedTo || undefined,
      reminderAt: values.reminderAt || undefined,
    };
    try {
      const saved = isEdit
        ? await followUpService.update(followUp._id, payload)
        : await followUpService.create(payload);
      toast.success(isEdit ? 'Follow-up updated' : 'Follow-up scheduled');
      onSaved(saved);
      onClose();
    } catch (err) {
      setServerError(err.response?.data?.message || 'Something went wrong. Please try again.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Follow-up' : 'Schedule Follow-up'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" form="followup-form" isLoading={isSubmitting}>
            {isEdit ? 'Save Changes' : 'Schedule'}
          </Button>
        </>
      }
    >
      {serverError && (
        <div className="mb-4 rounded-lg border border-rose-500/30 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-600">
          {serverError}
        </div>
      )}

      <form id="followup-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select label="Type" error={errors.type?.message} {...register('type', { required: true })}>
            {FOLLOWUP_TYPES.map((t) => (
              <option key={t} value={t}>
                {FOLLOWUP_TYPE_LABELS[t]}
              </option>
            ))}
          </Select>

          <Select
            label="Related customer"
            error={errors.relatedCustomer?.message}
            {...register('relatedCustomer', { required: 'A related customer is required' })}
          >
            <option value="">Select a customer…</option>
            {customerOptions?.items.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>

        <Input
          label="Subject"
          error={errors.subject?.message}
          {...register('subject', { required: 'Subject is required', maxLength: { value: 150, message: 'Too long' } })}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Input
            label="Scheduled for"
            type="datetime-local"
            error={errors.scheduledAt?.message}
            {...register('scheduledAt', { required: 'Scheduled date/time is required' })}
          />
          {type !== 'email' && (
            <Input
              label="Duration (min)"
              type="number"
              min="0"
              max="480"
              step="15"
              error={errors.durationMinutes?.message}
              {...register('durationMinutes')}
            />
          )}
          <Select label="Status" error={errors.status?.message} {...register('status')}>
            {FOLLOWUP_STATUSES.map((s) => (
              <option key={s} value={s}>
                {FOLLOWUP_STATUS_LABELS[s]}
              </option>
            ))}
          </Select>
        </div>

        <TextArea label="Notes" rows={3} error={errors.notes?.message} {...register('notes')} />

        <Input label="Reminder (optional)" type="datetime-local" error={errors.reminderAt?.message} {...register('reminderAt')} />

        {canAssign && (
          <Select label="Assign to" error={errors.assignedTo?.message} {...register('assignedTo')}>
            <option value="">Myself</option>
            {assignableUsers?.map((u) => (
              <option key={u._id} value={u._id}>
                {u.name} ({ROLE_LABELS[u.role]})
              </option>
            ))}
          </Select>
        )}
      </form>
    </Modal>
  );
};
