import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Modal } from '../../../components/ui/Modal.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { Input } from '../../../components/ui/Input.jsx';
import { Select } from '../../../components/ui/Select.jsx';
import {
  LEAD_STATUSES,
  LEAD_STATUS_LABELS,
  LEAD_SOURCES,
  LEAD_SOURCE_LABELS,
  LEAD_PRIORITIES,
  LEAD_PRIORITY_LABELS,
} from '../../../utils/leadEnums.js';
import { leadService } from '../../../services/leadService.js';

const emptyDefaults = {
  name: '',
  email: '',
  phone: '',
  company: '',
  status: 'new',
  source: 'other',
  priority: 'medium',
  estimatedValue: '',
};

/** `lead` prop present → edit mode (PATCH); absent → create mode (POST). */
export const LeadFormModal = ({ isOpen, onClose, lead, onSaved }) => {
  const isEdit = Boolean(lead);
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: emptyDefaults });

  useEffect(() => {
    if (isOpen) {
      reset(
        lead
          ? {
              name: lead.name,
              email: lead.email || '',
              phone: lead.phone || '',
              company: lead.company || '',
              status: lead.status,
              source: lead.source,
              priority: lead.priority,
              estimatedValue: lead.estimatedValue ?? '',
            }
          : emptyDefaults
      );
      setServerError('');
    }
  }, [isOpen, lead, reset]);

  const onSubmit = async (values) => {
    setServerError('');
    const payload = { ...values, estimatedValue: values.estimatedValue === '' ? 0 : Number(values.estimatedValue) };
    try {
      const saved = isEdit ? await leadService.update(lead._id, payload) : await leadService.create(payload);
      toast.success(isEdit ? 'Lead updated' : 'Lead added');
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
      title={isEdit ? 'Edit Lead' : 'Add Lead'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" form="lead-form" isLoading={isSubmitting}>
            {isEdit ? 'Save Changes' : 'Add Lead'}
          </Button>
        </>
      }
    >
      {serverError && (
        <div className="mb-4 rounded-lg border border-rose-500/30 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-600">
          {serverError}
        </div>
      )}

      <form id="lead-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Full name"
            error={errors.name?.message}
            {...register('name', { required: 'Name is required', maxLength: { value: 120, message: 'Too long' } })}
          />
          <Input
            label="Email"
            type="email"
            error={errors.email?.message}
            {...register('email', {
              pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email address' },
            })}
          />
          <Input label="Phone" error={errors.phone?.message} {...register('phone')} />
          <Input label="Company" error={errors.company?.message} {...register('company')} />

          <Select label="Status" error={errors.status?.message} {...register('status')}>
            {LEAD_STATUSES.map((s) => (
              <option key={s} value={s}>
                {LEAD_STATUS_LABELS[s]}
              </option>
            ))}
          </Select>

          <Select label="Source" error={errors.source?.message} {...register('source')}>
            {LEAD_SOURCES.map((s) => (
              <option key={s} value={s}>
                {LEAD_SOURCE_LABELS[s]}
              </option>
            ))}
          </Select>

          <Select label="Priority" error={errors.priority?.message} {...register('priority')}>
            {LEAD_PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {LEAD_PRIORITY_LABELS[p]}
              </option>
            ))}
          </Select>

          <Input
            label="Estimated value ($)"
            type="number"
            min="0"
            step="100"
            error={errors.estimatedValue?.message}
            {...register('estimatedValue', {
              min: { value: 0, message: 'Must be positive' },
            })}
          />
        </div>
      </form>
    </Modal>
  );
};
