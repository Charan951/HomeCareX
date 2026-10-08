import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useLocation } from 'react-router-dom';
import { Lock, ArrowRight, ArrowLeft, CheckCircle2, AlertCircle, AlertTriangle, WifiOff } from 'lucide-react';
import { authApi } from '@/services/authApi';
import { classifyApiError } from '@/lib/apiError';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { resetStateStore } from '@/features/auth/resetStateStore';
import PasswordField from '@/components/auth/PasswordField';
import PasswordStrength from '@/components/auth/PasswordStrength';

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const isOnline = useOnlineStatus();

  // Retrieve resetToken from router state, in-memory store, or URL query param (legacy)
  const stateToken = (location.state as { resetToken?: string } | null)?.resetToken;
  const token = (stateToken || resetStateStore.getResetToken() || searchParams.get('token') || '').trim();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ password?: string; confirmPassword?: string }>({});
  const [error, setError] = useState('');
  const [errorStatus, setErrorStatus] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    document.title = 'Reset Password | HomeCareX';
  }, []);

  function validate(): boolean {
    const nextErrors: { password?: string; confirmPassword?: string } = {};

    if (!password) {
      nextErrors.password = 'Password is required.';
    } else if (password.length < 8) {
      nextErrors.password = 'Password must be at least 8 characters.';
    } else if (!/[A-Z]/.test(password)) {
      nextErrors.password = 'Password requires at least one uppercase letter.';
    } else if (!/[0-9]/.test(password)) {
      nextErrors.password = 'Password requires at least one number.';
    } else if (!/[^A-Za-z0-9]/.test(password)) {
      nextErrors.password = 'Password requires at least one special character.';
    }

    if (!confirmPassword) {
      nextErrors.confirmPassword = 'Please confirm your password.';
    } else if (password !== confirmPassword) {
      nextErrors.confirmPassword = 'Passwords do not match.';
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;

    if (!isOnline) {
      setError("You're offline. Check your internet connection and try again.");
      return;
    }

    setError('');
    setErrorStatus(null);

    if (!validate()) return;

    if (!token) {
      setError('Invalid or missing password reset token. Please request a new code.');
      return;
    }

    setLoading(true);
    try {
      await authApi.resetPassword({ resetToken: token, newPassword: password });
      // Clear in-memory token immediately upon successful reset
      resetStateStore.clear();
      setSuccess(true);
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
        setError('Too many requests. Please wait a moment and try again.');
      } else if (
        classified.code === 'INVALID_RESET_TOKEN' ||
        classified.code === 'RESET_TOKEN_EXPIRED' ||
        classified.code === 'RESET_TOKEN_ALREADY_USED' ||
        classified.status === 400
      ) {
        setError(classified.message || 'This password reset session is invalid or has expired.');
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
    <div>
      <div className="bg-white/90 backdrop-blur-xl rounded-2xl border border-gray-100 shadow-[0_20px_60px_-15px_rgba(67,56,202,0.3)] p-6 sm:p-8">
        {!isOnline && (
          <div
            role="status"
            className="mb-4 text-xs sm:text-sm rounded-lg p-3 flex items-start gap-2.5 bg-amber-50 border border-amber-200 text-amber-800 animate-fadeUp"
          >
            <WifiOff size={17} className="shrink-0 mt-0.5 text-amber-600" aria-hidden="true" />
            <span className="leading-snug">You&apos;re offline. Check your internet connection and try again.</span>
          </div>
        )}

        {!token ? (
          <div className="text-center py-2 animate-fadeUp">
            <div className="h-12 w-12 rounded-xl bg-amber-50 flex items-center justify-center mx-auto mb-4 border border-amber-100">
              <AlertTriangle size={26} className="text-amber-500" />
            </div>
            <h1 className="text-2xl font-bold text-accent-700 mb-2">Invalid Reset Session</h1>
            <p className="text-gray-500 mb-6 text-sm">
              This password reset session is missing a valid verification token or has expired.
              Please restart the password reset process to proceed.
            </p>
            <div className="space-y-3">
              <Link
                to="/forgot-password"
                className="w-full bg-gradient-to-r from-brand-500 to-brand-600 text-white font-medium py-2.5 rounded-lg
                           hover:shadow-lg hover:shadow-brand-500/30 transition-all duration-200 flex items-center justify-center gap-2 text-sm"
              >
                Request new code
                <ArrowRight size={16} />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 font-medium"
              >
                <ArrowLeft size={16} />
                Back to Login
              </Link>
            </div>
          </div>
        ) : success ? (
          <div className="text-center py-2 animate-fadeUp">
            <div className="h-12 w-12 rounded-xl bg-green-50 flex items-center justify-center mx-auto mb-4 border border-green-100">
              <CheckCircle2 size={26} className="text-green-500" />
            </div>
            <h1 className="text-2xl font-bold text-accent-700 mb-1">Password reset successful</h1>
            <p className="text-gray-500 mb-6 text-sm">
              Your password has been reset successfully and all active sessions have been signed out. You can now log in with your new password.
            </p>
            <Link
              to="/login"
              className="w-full bg-gradient-to-r from-brand-500 to-brand-600 text-white font-medium py-2.5 rounded-lg
                         hover:shadow-lg hover:shadow-brand-500/30 transition-all duration-200 flex items-center justify-center gap-2 text-sm"
            >
              Log in now
              <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          <>
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shadow-lg shadow-brand-500/30 mb-5">
              <Lock size={22} className="text-white" />
            </div>

            <h1 className="text-2xl font-bold text-accent-700 mb-1">Set new password</h1>
            <p className="text-gray-500 mb-6 text-sm">
              Create a strong new password for your account.
            </p>

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
                <div className="leading-snug">
                  <span>{error}</span>
                  {(errorStatus === 400 || error.includes('expired') || error.includes('invalid')) && (
                    <div className="mt-1">
                      <Link to="/forgot-password" className="font-semibold underline hover:text-red-900">
                        Request a new verification code
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div>
                <PasswordField
                  id="reset-password"
                  name="password"
                  label="New Password"
                  required
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: undefined }));
                    if (error) setError('');
                  }}
                  error={fieldErrors.password}
                  disabled={loading || !isOnline}
                />
                <PasswordStrength password={password} />
              </div>

              <div>
                <PasswordField
                  id="reset-confirm-password"
                  name="confirmPassword"
                  label="Confirm New Password"
                  required
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (fieldErrors.confirmPassword) setFieldErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                    if (error) setError('');
                  }}
                  error={fieldErrors.confirmPassword}
                  disabled={loading || !isOnline}
                />
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
                    <span>Resetting password...</span>
                  </>
                ) : (
                  <>
                    <span>Reset password</span>
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
          </>
        )}
      </div>
    </div>
  );
};

export default ResetPasswordPage;
