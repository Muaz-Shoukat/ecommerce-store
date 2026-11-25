import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthShell from '../components/AuthShell';
import { Alert, PrimaryButton, SecondaryButton } from '../components/ui';
import { useAuth } from '../hooks/useAuth';

const inputClass =
  'w-full rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm outline-none transition focus:border-primary-400 focus:bg-white';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function validate() {
    const next = {};
    if (!username.trim()) next.username = 'Username is required.';
    if (!password) next.password = 'Password is required.';
    else if (password.length < 8) next.password = 'Use at least 8 characters.';
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    if (!validate()) return;
    setSubmitting(true);
    try {
      await login({ username, password });
      navigate('/products');
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(detail || 'Login failed. Check your username and password.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell title="Welcome back" subtitle="Sign in to track orders and checkout faster.">
      <form className="space-y-4" onSubmit={handleSubmit} noValidate>
        <label className="grid gap-1.5 text-sm font-medium text-neutral-700">
          Username
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            className={inputClass}
          />
          {fieldErrors.username && (
            <span className="text-xs text-error">{fieldErrors.username}</span>
          )}
        </label>

        <label className="grid gap-1.5 text-sm font-medium text-neutral-700">
          Password
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className={`${inputClass} pr-10`}
            />
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-neutral-500 hover:text-neutral-800"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {fieldErrors.password && (
            <span className="text-xs text-error">{fieldErrors.password}</span>
          )}
        </label>

        {error && <Alert tone="error">{error}</Alert>}

        <PrimaryButton type="submit" className="w-full" disabled={submitting}>
          {submitting ? 'Signing in…' : 'Sign in'}
        </PrimaryButton>
      </form>

      <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-wide text-neutral-400">
        <span className="h-px flex-1 bg-neutral-200" />
        Or continue with
        <span className="h-px flex-1 bg-neutral-200" />
      </div>

      {/* PLACEHOLDER: social login buttons — not wired to OAuth */}
      <div className="grid grid-cols-2 gap-2">
        <SecondaryButton type="button" className="w-full px-3 py-2 text-xs" disabled>
          Google
        </SecondaryButton>
        <SecondaryButton type="button" className="w-full px-3 py-2 text-xs" disabled>
          Apple
        </SecondaryButton>
      </div>
      <p className="mt-2 text-center text-xs text-neutral-400">
        Social login is a visual placeholder only.
      </p>

      <p className="mt-6 text-sm text-neutral-600">
        No account?{' '}
        <Link to="/register" className="font-semibold text-primary-700 no-underline hover:underline">
          Register
        </Link>
      </p>
    </AuthShell>
  );
}
