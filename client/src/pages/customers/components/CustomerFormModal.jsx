import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Modal } from '../../../components/ui/Modal.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { Input } from '../../../components/ui/Input.jsx';
import { Select } from '../../../components/ui/Select.jsx';
import { TagInput } from './TagInput.jsx';
import { CUSTOMER_STATUSES, CUSTOMER_STATUS_LABELS } from '../../../utils/customerEnums.js';
import { customerService } from '../../../services/customerService.js';

const emptyDefaults = {
  name: '',
  email: '',
  phone: '',
  company: '',
  industry: '',
  address: '',
  status: 'lead',
  tags: [],
};

/**
 * `customer` prop present → edit mode (PATCH); absent → create mode (POST).
 * Both flows share one form/validation set since the field shapes are
 * identical — only the submit handler and default values differ.
 */
export const CustomerFormModal = ({ isOpen, onClose, customer, onSaved }) => {
  const isEdit = Boolean(customer);
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: emptyDefaults });

  // Re-seed the form whenever a different customer is opened for editing,
  // or the modal is reopened fresh for "Add Customer".
  useEffect(() => {
    if (isOpen) {
      reset(
        customer
          ? {
              name: customer.name,
              email: customer.email,
              phone: customer.phone || '',
              company: customer.company || '',
              industry: customer.industry || '',
              address: customer.address || '',
              status: customer.status,
              tags: customer.tags || [],
            }
          : emptyDefaults
      );
      setServerError('');
    }
  }, [isOpen, customer, reset]);

  const onSubmit = async (values) => {
    setServerError('');
    try {
      const saved = isEdit
        ? await customerService.update(customer._id, values)
        : await customerService.create(values);
      toast.success(isEdit ? 'Customer updated' : 'Customer added');
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
      title={isEdit ? 'Edit Customer' : 'Add Customer'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" form="customer-form" isLoading={isSubmitting}>
            {isEdit ? 'Save Changes' : 'Add Customer'}
          </Button>
        </>
      }
    >
      {serverError && (
        <div className="mb-4 rounded-lg border border-rose-500/30 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-600">
          {serverError}
        </div>
      )}

      <form id="customer-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
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
              required: 'Email is required',
              pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email address' },
            })}
          />
          <Input label="Phone" error={errors.phone?.message} {...register('phone')} />
          <Input label="Company" error={errors.company?.message} {...register('company')} />
          <Input label="Industry" error={errors.industry?.message} {...register('industry')} />
          <Select label="Status" error={errors.status?.message} {...register('status')}>
            {CUSTOMER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {CUSTOMER_STATUS_LABELS[s]}
              </option>
            ))}
          </Select>
        </div>

        <Input label="Address" error={errors.address?.message} {...register('address')} />

        <Controller
          name="tags"
          control={control}
          render={({ field }) => <TagInput value={field.value} onChange={field.onChange} />}
        />
      </form>
    </Modal>
  );
};
