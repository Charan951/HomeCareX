import React, { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Home } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import type { ApiError } from '@/lib/http';
import { ADMIN_ROLES, type AuthUser } from '@/types/auth';

/** Only same-origin paths are allowed as returnUrl (blocks //evil.com, https://..., javascript:). */
function safeReturnUrl(raw: string | null): string | null {
  if (!raw) return null;
  return raw.startsWith('/') && !raw.startsWith('//') && !raw.startsWith('/\\') ? raw : null;
}

/** A returnUrl is only honoured when it belongs to the role's own area. */
function destinationFor(user: AuthUser, returnUrl: string | null): string {
  const area = ADMIN_ROLES.includes(user.role) ? '/admin' : `/${user.role}`;
  if (returnUrl && (returnUrl === area || returnUrl.startsWith(`${area}/`))) return returnUrl;
  return user.home || area;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const LoginPage: React.FC = () => {
  const { login, user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const returnUrl = safeReturnUrl(params.get('returnUrl'));

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(params.get('expired') ? 'Your session has expired. Please log in again.' : '');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = 'Log in | HomeCareX';
  }, []);

  // Already signed in: go straight to the role's dashboard.
  if (isAuthenticated && user && !loading) return <Navigate to={destinationFor(user, returnUrl)} replace />;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setError('');
    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }
    if (!EMAIL_RE.test(email.trim())) {
      setError('Enter a valid email address.');
      return;
    }
    setLoading(true);
    try {
      const signedIn = await login({ email: email.trim(), password });
      navigate(destinationFor(signedIn, returnUrl), { replace: true });
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.message || 'Login failed. Please try again.');
      setLoading(false);
    }
  }

  return (
    <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-[0_20px_60px_-15px_rgba(67,56,202,0.3)] border border-gray-100 p-8 relative">
      {/* Premium icon badge */}
      <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shadow-lg shadow-brand-500/30 mb-5">
        <Home size={22} className="text-white" />
      </div>

      <h1 className="text-2xl font-bold text-accent-700 mb-1">Welcome back</h1>
      <p className="text-gray-500 mb-6">Log in to your HomeCareX account</p>

      {error && (
        <div role="alert" id="login-error" className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 animate-fadeUp">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4" noValidate aria-describedby={error ? 'login-error' : undefined}>
        <div className="group">
          <label htmlFor="login-email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <div className="relative">
            <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-500 transition-colors" />
            <input
              id="login-email"
              type="email"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-lg border border-gray-300 pl-10 pr-3 py-2.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-400 hover:border-gray-400"
            />
          </div>
        </div>

        <div className="group">
          <div className="flex items-center justify-between mb-1">
            <label htmlFor="login-password" className="block text-sm font-medium text-gray-700">Password</label>
            <Link to="/forgot-password" className="text-sm text-brand-600 hover:underline">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-500 transition-colors" />
            <input
              id="login-password"
              name="password"
              autoComplete="current-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-lg border border-gray-300 pl-10 pr-10 py-2.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-400 hover:border-gray-400"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-brand-500 to-brand-600 text-white font-medium py-2.5 rounded-lg
                     hover:shadow-lg hover:shadow-brand-500/30 hover:-translate-y-0.5
                     active:translate-y-0 disabled:opacity-60 disabled:hover:translate-y-0
                     transition-all duration-200 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              Logging in...
            </>
          ) : (
            <>
              Login
              <ArrowRight size={16} />
            </>
          )}
        </button>
      </form>

      <p className="text-center text-sm text-gray-500 mt-6">
        Don't have an account?{' '}
        <Link to="/register" className="text-brand-600 font-medium hover:underline">
          Register
        </Link>
      </p>
    </div>
  );
};

export default LoginPage;