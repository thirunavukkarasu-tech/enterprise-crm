import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';
import { Input } from '../../components/ui/Input.jsx';
import { Button } from '../../components/ui/Button.jsx';

export default function ForgotPassword() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm();

  const onSubmit = async (_values) => {
    // Ships in Phase 2: POST /auth/forgot-password → emails a reset link.
    toast('Password reset flow ships in Phase 2 🚧');
  };

  return (
    <div>
      <Link to="/login" className="mb-6 flex items-center gap-1.5 text-sm font-medium text-ink-600 hover:text-ink-800">
        <ArrowLeft className="h-4 w-4" /> Back to login
      </Link>

      <h1 className="font-display text-2xl font-semibold text-ink">Forgot your password?</h1>
      <p className="mt-1.5 text-sm text-ink-600">
        Enter your work email and we'll send you a link to reset it.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5" noValidate>
        <Input
          label="Work email"
          type="email"
          placeholder="you@company.com"
          error={errors.email?.message}
          {...register('email', {
            required: 'Email is required',
            pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email address' },
          })}
        />
        <Button type="submit" className="w-full" isLoading={isSubmitting}>
          Send Reset Link
        </Button>
      </form>
    </div>
  );
}
