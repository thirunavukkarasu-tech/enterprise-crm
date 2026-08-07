import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { ShieldCheck } from 'lucide-react';
import { Card, CardHeader } from '../../../components/ui/Card.jsx';
import { Input } from '../../../components/ui/Input.jsx';
import { Button } from '../../../components/ui/Button.jsx';
import { userService } from '../../../services/userService.js';

export const SecurityTab = () => {
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm();

  const onSubmit = async (values) => {
    try {
      await userService.changeMyPassword(values);
      toast.success('Password changed. Other sessions have been signed out.');
      reset();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not change your password.');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader title="Change Password" subtitle="Choose a strong password you haven't used before" />
        <form onSubmit={handleSubmit(onSubmit)} className="max-w-md space-y-4 px-5 py-5" noValidate>
          <Input
            label="Current password"
            type="password"
            autoComplete="current-password"
            error={errors.currentPassword?.message}
            {...register('currentPassword', { required: 'Current password is required' })}
          />
          <Input
            label="New password"
            type="password"
            autoComplete="new-password"
            error={errors.newPassword?.message}
            {...register('newPassword', {
              required: 'New password is required',
              minLength: { value: 8, message: 'Must be at least 8 characters' },
              pattern: { value: /\d/, message: 'Must contain at least one number' },
            })}
          />
          <Input
            label="Confirm new password"
            type="password"
            autoComplete="new-password"
            error={errors.confirmPassword?.message}
            {...register('confirmPassword', {
              required: 'Please confirm your new password',
              validate: (value) => value === watch('newPassword') || 'Passwords do not match',
            })}
          />
          <div className="flex justify-end">
            <Button type="submit" isLoading={isSubmitting}>
              Change Password
            </Button>
          </div>
        </form>
      </Card>

      <Card className="flex items-start gap-3 p-5">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-brand-500" aria-hidden="true" />
        <div>
          <p className="text-sm font-medium text-ink-800">Single active session</p>
          <p className="mt-1 text-sm text-ink-600">
            Changing your password automatically signs you out of any other device or browser where you're
            logged in — you'll need to sign back in there with your new password.
          </p>
        </div>
      </Card>
    </div>
  );
};
