import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Modal } from '../../../components/ui/Modal.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { Input } from '../../../components/ui/Input.jsx';
import { Select } from '../../../components/ui/Select.jsx';
import { adminService } from '../../../services/adminService.js';
import { ALL_ROLES, ROLE_LABELS } from '../../../utils/roles.js';

const emptyDefaults = { name: '', email: '', password: '', role: 'employee' };

/** `targetUser` present → edit mode (role/status/name only, no password field); absent → create mode. */
export const UserFormModal = ({ isOpen, onClose, targetUser, currentUserId, onSaved }) => {
  const isEdit = Boolean(targetUser);
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
        targetUser
          ? {
              name: targetUser.name,
              email: targetUser.email,
              role: targetUser.role,
              isActive: targetUser.isActive ? 'true' : 'false',
            }
          : emptyDefaults
      );
      setServerError('');
    }
  }, [isOpen, targetUser, reset]);

  const isSelf = isEdit && targetUser._id === currentUserId;

  const onSubmit = async (values) => {
    setServerError('');
    try {
      const saved = isEdit
        ? await adminService.updateUser(targetUser._id, {
            name: values.name,
            role: isSelf ? undefined : values.role,
            isActive: isSelf ? undefined : values.isActive === 'true' || values.isActive === true,
          })
        : await adminService.createUser(values);
      toast.success(isEdit ? 'User updated' : 'User created');
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
      title={isEdit ? `Edit ${targetUser?.name}` : 'Create User'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" form="user-form" isLoading={isSubmitting}>
            {isEdit ? 'Save Changes' : 'Create User'}
          </Button>
        </>
      }
    >
      {serverError && (
        <div className="mb-4 rounded-lg border border-rose-500/30 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-600">
          {serverError}
        </div>
      )}

      <form id="user-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Input
          label="Full name"
          error={errors.name?.message}
          {...register('name', { required: 'Name is required', maxLength: { value: 80, message: 'Too long' } })}
        />
        <Input
          label="Email"
          type="email"
          disabled={isEdit}
          className={isEdit ? 'cursor-not-allowed opacity-70' : undefined}
          error={errors.email?.message}
          {...register('email', {
            required: !isEdit && 'Email is required',
            pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email address' },
          })}
        />
        {!isEdit && (
          <Input
            label="Initial password"
            type="password"
            error={errors.password?.message}
            {...register('password', {
              required: 'Password is required',
              minLength: { value: 8, message: 'Must be at least 8 characters' },
            })}
          />
        )}

        {isSelf && (
          <p className="rounded-lg border border-amber-400/30 bg-amber-50 px-3.5 py-2.5 text-xs text-amber-700">
            You can't change your own role or deactivate your own account — ask another admin.
          </p>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select label="Role" disabled={isSelf} error={errors.role?.message} {...register('role', { required: true })}>
            {ALL_ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </Select>

          {isEdit && (
            <Select label="Status" disabled={isSelf} {...register('isActive')}>
              <option value="true">Active</option>
              <option value="false">Deactivated</option>
            </Select>
          )}
        </div>
      </form>
    </Modal>
  );
};
