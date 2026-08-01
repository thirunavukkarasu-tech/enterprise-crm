import { useForm } from 'react-hook-form';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { Input } from '../../components/ui/Input.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { authService } from '../../services/authService.js';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [formError, setFormError] = useState('');
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm();

  const onSubmit = async (values) => {
    setFormError('');
    try {
      await authService.resetPassword(token, {
        password: values.password,
        passwordConfirm: values.confirmPassword,
      });
      toast.success('Password reset — please sign in with your new password.');
      navigate('/login', { replace: true });
    } catch (err) {
      setFormError(err.response?.data?.message || 'This reset link is invalid or has expired.');
    }
  };

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink">Set a new password</h1>
      <p className="mt-1.5 text-sm text-ink-600">Choose a strong password you haven't used before.</p>

      {formError && (
        <div className="mt-6 rounded-lg border border-rose-500/30 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-600">
          {formError}{' '}
          <Link to="/forgot-password" className="font-medium underline">
            Request a new link
          </Link>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-5" noValidate>
        <Input
          label="New password"
          type="password"
          placeholder="••••••••"
          error={errors.password?.message}
          {...register('password', {
            required: 'Password is required',
            minLength: { value: 8, message: 'Must be at least 8 characters' },
            pattern: { value: /\d/, message: 'Must contain at least one number' },
          })}
        />
        <Input
          label="Confirm new password"
          type="password"
          placeholder="••••••••"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword', {
            required: 'Please confirm your password',
            validate: (value) => value === watch('password') || 'Passwords do not match',
          })}
        />
        <Button type="submit" className="w-full" isLoading={isSubmitting}>
          Reset Password
        </Button>
      </form>
    </div>
  );
}
