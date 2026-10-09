import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ArrowRight, ArrowLeft, AlertCircle, AlertTriangle, WifiOff } from 'lucide-react';
import { authApi } from '@/services/authApi';
import { classifyApiError } from '@/lib/apiError';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { resetStateStore } from '@/features/auth/resetStateStore';
import AuthFormHeader from '@/components/auth/AuthFormHeader';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const isOnline = useOnlineStatus();

  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [errorStatus, setErrorStatus] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = 'Forgot Password | HomeCareX';
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;

    if (!isOnline) {
      setError("You're offline. Check your internet connection and try again.");
      return;
    }

    setError('');
    setErrorStatus(null);

    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !EMAIL_RE.test(trimmed)) {
      setError('Please enter a valid email address.');
      return;
    }

    setLoading(true);
    try {
      await authApi.forgotPassword(trimmed);
      // Store in memory (never in localStorage/cookies)
      resetStateStore.setEmail(trimmed);
      // Navigate to OTP verification page
      navigate('/verify-otp', { state: { email: trimmed } });
    } catch (err) {
      const classified = classifyApiError(err);
      setErrorStatus(classified.status ?? null);

      if (classified.kind === 'offline') {
        setError("You're offline. Check your internet connection and try again.");
      } else if (classified.kind === 'network') {
        setError('Unable to connect to the server. Please check your connection and try again.');
      } else if (classified.kind === 'timeout') {
        setError('The server is taking too long to respond. Please check your connection and try again.');
      } else if (classified.status === 429) {
        setError('Too many password reset requests. Please wait a moment and try again.');
      } else if (classified.status && classified.status >= 500) {
        setError('A server error occurred. Please try again shortly.');
      } else {
        setError(classified.message || 'Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full">
      <AuthFormHeader
        title="Forgot your password?"
        subtitle="Enter your email and we'll send you a 6-digit verification code to reset it."
      />

        {!isOnline && (
          <div
            role="status"
            className="mb-4 text-xs sm:text-sm rounded-lg p-3 flex items-start gap-2.5 bg-amber-50 border border-amber-200 text-amber-800 animate-fadeUp"
          >
            <WifiOff size={17} className="shrink-0 mt-0.5 text-amber-600" aria-hidden="true" />
            <span className="leading-snug">You&apos;re offline. Check your internet connection and try again.</span>
          </div>
        )}

        {error && (
          <div
            role="alert"
            className={`mb-4 text-xs sm:text-sm rounded-lg p-3 flex items-start gap-2.5 animate-fadeUp ${
              errorStatus === 429
                ? 'bg-amber-50 border border-amber-200 text-amber-800'
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}
          >
            {errorStatus === 429 ? (
              <AlertTriangle size={17} className="shrink-0 mt-0.5 text-amber-600" aria-hidden="true" />
            ) : (
              <AlertCircle size={17} className="shrink-0 mt-0.5 text-red-500" aria-hidden="true" />
            )}
            <span className="leading-snug">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="group">
            <label htmlFor="forgot-email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <div className="relative">
              <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-500 transition-colors pointer-events-none" />
              <input
                id="forgot-email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError('');
                }}
                placeholder="you@example.com"
                disabled={loading || !isOnline}
                autoComplete="email"
                autoFocus
                className="w-full rounded-lg border border-gray-300 pl-10 pr-3 py-2.5 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-400 hover:border-gray-400 disabled:bg-gray-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !isOnline}
            className="w-full bg-gradient-to-r from-brand-500 to-brand-600 text-white font-medium py-2.5 rounded-lg
                       hover:shadow-lg hover:shadow-brand-500/30 hover:-translate-y-0.5
                       active:translate-y-0 disabled:opacity-60 disabled:hover:translate-y-0 disabled:cursor-not-allowed
                       transition-all duration-200 flex items-center justify-center gap-2 text-sm"
          >
            {loading ? (
              <>
                <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                <span>Sending code...</span>
              </>
            ) : (
              <>
                <span>Send verification code</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>

          <div className="text-center pt-2">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-accent-700 transition-colors"
            >
              <ArrowLeft size={16} />
              Back to Login
            </Link>
          </div>
        </form>
    </div>
  );
};

export default ForgotPasswordPage;