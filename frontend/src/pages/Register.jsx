import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthShell from '../components/AuthShell';
import { Alert, PrimaryButton, SecondaryButton } from '../components/ui';
import { useAuth } from '../hooks/useAuth';

const inputClass =
  'w-full rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm outline-none transition focus:border-primary-400 focus:bg-white';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: '',
    email: '',
    phone: '',
    password: '',
    password_confirm: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function updateField(field) {
    return (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }));
  }

  function validate() {
    const next = {};
    if (!form.username.trim()) next.username = 'Username is required.';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      next.email = 'Enter a valid email.';
    }
    if (!form.password) next.password = 'Password is required.';
    else if (form.password.length < 8) next.password = 'Use at least 8 characters.';
    if (form.password !== form.password_confirm) {
      next.password_confirm = 'Passwords do not match.';
    }
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    if (!validate()) return;
    setSubmitting(true);
    try {
      await register(form);
      navigate('/products');
    } catch (err) {
      const data = err.response?.data;
      if (data && typeof data === 'object') {
        const firstKey = Object.keys(data)[0];
        const message = Array.isArray(data[firstKey]) ? data[firstKey][0] : data[firstKey];
        setError(message || 'Registration failed.');
      } else {
        setError('Registration failed.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell title="Create your account" subtitle="Save addresses and track every school order.">
      <form className="space-y-4" onSubmit={handleSubmit} noValidate>
        <label className="grid gap-1.5 text-sm font-medium text-neutral-700">
          Username
          <input
            type="text"
            value={form.username}
            onChange={updateField('username')}
            autoComplete="username"
            className={inputClass}
          />
          {fieldErrors.username && (
            <span className="text-xs text-error">{fieldErrors.username}</span>
          )}
        </label>

        <label className="grid gap-1.5 text-sm font-medium text-neutral-700">
          Email
          <input
            type="email"
            value={form.email}
            onChange={updateField('email')}
            autoComplete="email"
            className={inputClass}
          />
          {fieldErrors.email && (
            <span className="text-xs text-error">{fieldErrors.email}</span>
          )}
        </label>

        <label className="grid gap-1.5 text-sm font-medium text-neutral-700">
          Phone
          <input
            type="tel"
            value={form.phone}
            onChange={updateField('phone')}
            autoComplete="tel"
            className={inputClass}
          />
        </label>

        <label className="grid gap-1.5 text-sm font-medium text-neutral-700">
          Password
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              onChange={updateField('password')}
              autoComplete="new-password"
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

        <label className="grid gap-1.5 text-sm font-medium text-neutral-700">
          Confirm password
          <input
            type={showPassword ? 'text' : 'password'}
            value={form.password_confirm}
            onChange={updateField('password_confirm')}
            autoComplete="new-password"
            className={inputClass}
          />
          {fieldErrors.password_confirm && (
            <span className="text-xs text-error">{fieldErrors.password_confirm}</span>
          )}
        </label>

        {error && <Alert tone="error">{error}</Alert>}

        <PrimaryButton type="submit" className="w-full" disabled={submitting}>
          {submitting ? 'Creating account…' : 'Create account'}
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
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-primary-700 no-underline hover:underline">
          Login
        </Link>
      </p>
    </AuthShell>
  );
}
