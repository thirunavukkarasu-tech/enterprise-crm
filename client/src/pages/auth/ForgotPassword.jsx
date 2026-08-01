import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { ArrowLeft, MailCheck } from 'lucide-react';
import { Input } from '../../components/ui/Input.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { authService } from '../../services/authService.js';

export default function ForgotPassword() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm();
  const [submitted, setSubmitted] = useState(false);

  const onSubmit = async (values) => {
    // The API always returns a generic success message regardless of
    // whether the email exists (prevents user enumeration) — so the UI
    // simply shows the same confirmation state on any successful response.
    await authService.forgotPassword(values.email);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="text-center">
        <MailCheck className="mx-auto h-10 w-10 text-brand-500" aria-hidden="true" />
        <h1 className="mt-4 font-display text-2xl font-semibold text-ink">Check your email</h1>
        <p className="mt-1.5 text-sm text-ink-600">
          If an account exists for that address, we've sent a link to reset your password.
        </p>
        <Link
          to="/login"
          className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700"
        >
          <ArrowLeft className="h-4 w-4" /> Back to login
        </Link>
      </div>
    );
  }

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
