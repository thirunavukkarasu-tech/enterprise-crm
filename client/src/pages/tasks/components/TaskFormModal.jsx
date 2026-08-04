import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Modal } from '../../../components/ui/Modal.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { Input } from '../../../components/ui/Input.jsx';
import { Select } from '../../../components/ui/Select.jsx';
import { TextArea } from '../../../components/ui/TextArea.jsx';
import {
  TASK_STATUSES,
  TASK_STATUS_LABELS,
  TASK_PRIORITIES,
  TASK_PRIORITY_LABELS,
  TASK_CATEGORIES,
  TASK_CATEGORY_LABELS,
} from '../../../utils/taskEnums.js';
import { taskService } from '../../../services/taskService.js';
import { customerService } from '../../../services/customerService.js';
import { useApiQuery } from '../../../hooks/useApiQuery.js';
import { useAssignableUsers } from '../../../hooks/useAssignableUsers.js';
import { ROLE_LABELS } from '../../../utils/roles.js';

/** Converts an ISO date string to the `datetime-local` input format (local time, no seconds/offset). */
const toDatetimeLocal = (isoString) => {
  if (!isoString) return '';
  const d = new Date(isoString);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const emptyDefaults = {
  title: '',
  description: '',
  dueDate: '',
  priority: 'medium',
  status: 'pending',
  category: 'other',
  relatedCustomer: '',
  assignedTo: '',
  reminderAt: '',
};

/** `task` prop present → edit mode (PATCH); absent → create mode (POST). */
export const TaskFormModal = ({ isOpen, onClose, task, onSaved, defaultCustomerId }) => {
  const isEdit = Boolean(task);
  const [serverError, setServerError] = useState('');

  // Lightweight related-customer picker — the 50 most recently added
  // customers. A full searchable async-select would be the natural upgrade
  // once the customer list grows well beyond what fits in one dropdown.
  const { data: customerOptions } = useApiQuery(
    () => customerService.list({ limit: 50, sortBy: 'createdAt', sortOrder: 'desc' }),
    []
  );
  const { data: assignableUsers, canAssign } = useAssignableUsers();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: emptyDefaults });

  useEffect(() => {
    if (isOpen) {
      reset(
        task
          ? {
              title: task.title,
              description: task.description || '',
              dueDate: toDatetimeLocal(task.dueDate),
              priority: task.priority,
              status: task.status,
              category: task.category,
              relatedCustomer: task.relatedCustomer?._id || '',
              assignedTo: task.assignedTo?._id || '',
              reminderAt: toDatetimeLocal(task.reminderAt),
            }
          : { ...emptyDefaults, relatedCustomer: defaultCustomerId || '' }
      );
      setServerError('');
    }
  }, [isOpen, task, defaultCustomerId, reset]);

  const onSubmit = async (values) => {
    setServerError('');
    const payload = {
      ...values,
      relatedCustomer: values.relatedCustomer || undefined,
      assignedTo: values.assignedTo || undefined,
      reminderAt: values.reminderAt || undefined,
    };
    try {
      const saved = isEdit ? await taskService.update(task._id, payload) : await taskService.create(payload);
      toast.success(isEdit ? 'Task updated' : 'Task created');
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
      title={isEdit ? 'Edit Task' : 'Create Task'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" form="task-form" isLoading={isSubmitting}>
            {isEdit ? 'Save Changes' : 'Create Task'}
          </Button>
        </>
      }
    >
      {serverError && (
        <div className="mb-4 rounded-lg border border-rose-500/30 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-600">
          {serverError}
        </div>
      )}

      <form id="task-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Input
          label="Title"
          error={errors.title?.message}
          {...register('title', { required: 'Title is required', maxLength: { value: 150, message: 'Too long' } })}
        />

        <TextArea label="Description" rows={3} error={errors.description?.message} {...register('description')} />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Due date"
            type="datetime-local"
            error={errors.dueDate?.message}
            {...register('dueDate', { required: 'Due date is required' })}
          />
          <Input label="Reminder (optional)" type="datetime-local" error={errors.reminderAt?.message} {...register('reminderAt')} />

          <Select label="Priority" error={errors.priority?.message} {...register('priority')}>
            {TASK_PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {TASK_PRIORITY_LABELS[p]}
              </option>
            ))}
          </Select>

          <Select label="Status" error={errors.status?.message} {...register('status')}>
            {TASK_STATUSES.map((s) => (
              <option key={s} value={s}>
                {TASK_STATUS_LABELS[s]}
              </option>
            ))}
          </Select>

          <Select label="Category" error={errors.category?.message} {...register('category')}>
            {TASK_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {TASK_CATEGORY_LABELS[c]}
              </option>
            ))}
          </Select>

          <Select label="Related customer (optional)" error={errors.relatedCustomer?.message} {...register('relatedCustomer')}>
            <option value="">None</option>
            {customerOptions?.items.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </Select>

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
        </div>
      </form>
    </Modal>
  );
};
