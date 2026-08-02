import { useForm } from 'react-hook-form';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Input } from '../../components/ui/Input.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

export default function Login() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm();
  const [formError, setFormError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const redirectTo = location.state?.from?.pathname || '/dashboard';

  const onSubmit = async (values) => {
    setFormError('');
    try {
      await login(values);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setFormError(err.response?.data?.message || 'Unable to sign in. Please try again.');
    }
  };

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink">Welcome back</h1>
      <p className="mt-1.5 text-sm text-ink-600">Sign in to your CRM workspace.</p>

      {formError && (
        <div className="mt-6 rounded-lg border border-rose-500/30 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-600">
          {formError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-5" noValidate>
        <Input
          label="Work email"
          type="email"
          placeholder="you@company.com"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email', {
            required: 'Email is required',
            pattern: { value: /^\S+@\S+\.\S+$/, message: 'Enter a valid email address' },
          })}
        />
        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register('password', { required: 'Password is required' })}
        />

        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-ink-700">
            <input type="checkbox" className="h-4 w-4 rounded border-surface-300 text-brand-500" />
            Remember me
          </label>
          <Link to="/forgot-password" className="font-medium text-brand-600 hover:text-brand-700">
            Forgot password?
          </Link>
        </div>

        <Button type="submit" className="w-full" isLoading={isSubmitting}>
          Sign In
        </Button>
      </form>

      <p className="mt-8 text-center text-xs text-ink-600">
        Demo accounts — see <code className="rounded bg-surface-200 px-1 py-0.5">server/src/seed/users.seed.js</code> for
        credentials per role.
      </p>
    </div>
  );
}
