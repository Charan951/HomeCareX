import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShieldCheck, ArrowRight, AlertCircle, AlertTriangle, WifiOff, CheckCircle2 } from 'lucide-react';
import { authApi } from '@/services/authApi';
import { classifyApiError } from '@/lib/apiError';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { resetStateStore } from '@/features/auth/resetStateStore';
import OtpInput from '@/components/auth/OtpInput';
import ResendTimer from '@/components/auth/ResendTimer';

export const VerifyOtpPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isOnline = useOnlineStatus();

  // Retrieve email from navigation state or in-memory store
  const stateEmail = (location.state as { email?: string } | null)?.email;
  const email = (stateEmail || resetStateStore.getEmail()).trim().toLowerCase();

  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [errorStatus, setErrorStatus] = useState<number | null>(null);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = 'Verify Code | HomeCareX';
  }, []);

  // If no email exists in router state or in memory, redirect back to forgot-password
  useEffect(() => {
    if (!email) {
      navigate('/forgot-password', { replace: true });
    }
  }, [email, navigate]);

  const handleVerify = useCallback(async (codeToVerify?: string) => {
    const code = (codeToVerify || otp).trim();
    if (loading) return;

    if (!isOnline) {
      setError("You're offline. Check your internet connection and try again.");
      return;
    }

    if (code.length !== 6 || !/^\d{6}$/.test(code)) {
      setError('Please enter the complete 6-digit verification code.');
      return;
    }

    setError('');
    setErrorStatus(null);
    setResendSuccess(false);
    setLoading(true);

    try {
      const response = await authApi.verifyOtp({ email, otp: code });
      const resetToken = response.resetToken;

      if (!resetToken) {
        throw new Error('Verification succeeded but reset token was not provided.');
      }

      // Store in memory (strictly runtime memory, never in localStorage/cookies)
      resetStateStore.setResetToken(resetToken);

      // Navigate to /reset-password with token in state
      navigate('/reset-password', {
        state: { email, resetToken },
        replace: true,
      });
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
        setError('Too many attempts. Please request a new code.');
      } else if (classified.code === 'OTP_EXPIRED') {
        setError('This verification code has expired. Please request a new code.');
      } else if (classified.code === 'TOO_MANY_ATTEMPTS') {
        setError('Too many attempts. Please request a new code.');
      } else if (classified.code === 'INVALID_OTP') {
        setError('The verification code is invalid. Please try again.');
      } else if (classified.status === 400) {
        setError(classified.message || 'The verification code is invalid. Please try again.');
      } else if (classified.status && classified.status >= 500) {
        setError('A server error occurred. Please try again shortly.');
      } else {
        setError(classified.message || 'Failed to verify code. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [loading, isOnline, otp, email, navigate]);

  const handleResendOtp = async () => {
    if (!isOnline) {
      setError("You're offline. Check your internet connection and try again.");
      return false;
    }

    setError('');
    setErrorStatus(null);
    setResendSuccess(false);

    try {
      await authApi.resendOtp(email);
      setResendSuccess(true);
      setOtp('');
      return true;
    } catch (err) {
      const classified = classifyApiError(err);
      setErrorStatus(classified.status ?? null);

      if (classified.kind === 'offline') {
        setError("You're offline. Check your internet connection and try again.");
      } else if (classified.kind === 'network') {
        setError('Unable to connect to the server. Please check your connection and try again.');
      } else if (classified.status === 429) {
        setError('Too many resend attempts. Please wait a moment before trying again.');
      } else if (classified.status && classified.status >= 500) {
        setError('A server error occurred. Please try again shortly.');
      } else {
        setError(classified.message || 'Failed to resend verification code. Please try again.');
      }
      return false;
    }
  };

  const maskedEmail = email
    ? email.replace(/^(.)(.*)(@.*)$/, (_, first, middle, domain) => {
        const masked = middle.length > 2 ? `${middle[0]}${'*'.repeat(middle.length - 2)}${middle[middle.length - 1]}` : '*'.repeat(middle.length);
        return `${first}${masked}${domain}`;
      })
    : '';

  return (
    <div>
      <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-[0_20px_60px_-15px_rgba(67,56,202,0.3)] border border-gray-100 p-6 sm:p-8">
        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shadow-lg shadow-brand-500/30 mb-5">
          <ShieldCheck size={24} className="text-white" />
        </div>

        <h1 className="text-2xl font-bold text-accent-700 mb-1">Verify your email</h1>
        <p className="text-gray-500 mb-6 text-sm">
          We&apos;ve sent a 6-digit verification code to{' '}
          <strong className="text-gray-800 font-medium">{maskedEmail || email}</strong>.
          Enter the code below to reset your password.
        </p>

        {!isOnline && (
          <div
            role="status"
            className="mb-4 text-xs sm:text-sm rounded-lg p-3 flex items-start gap-2.5 bg-amber-50 border border-amber-200 text-amber-800 animate-fadeUp"
          >
            <WifiOff size={17} className="shrink-0 mt-0.5 text-amber-600" aria-hidden="true" />
            <span className="leading-snug">You&apos;re offline. Check your internet connection and try again.</span>
          </div>
        )}

        {resendSuccess && (
          <div
            role="status"
            className="mb-4 text-xs sm:text-sm rounded-lg p-3 flex items-start gap-2.5 bg-green-50 border border-green-200 text-green-800 animate-fadeUp"
          >
            <CheckCircle2 size={17} className="shrink-0 mt-0.5 text-green-600" aria-hidden="true" />
            <span className="leading-snug">A new verification code has been sent to your email.</span>
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
            <div className="leading-snug">
              <span>{error}</span>
              {(error.includes('expired') || error.includes('Too many attempts')) && (
                <div className="mt-1">
                  <span className="text-gray-600 text-xs">Use the resend button below to get a fresh code.</span>
                </div>
              )}
            </div>
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleVerify();
          }}
          className="space-y-6"
          noValidate
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3 text-center sm:text-left">
              Verification Code
            </label>
            <OtpInput
              value={otp}
              onChange={(val) => {
                setOtp(val);
                if (error) setError('');
                if (resendSuccess) setResendSuccess(false);
              }}
              onComplete={(completedCode) => {
                handleVerify(completedCode);
              }}
              disabled={loading || !isOnline}
              hasError={Boolean(error)}
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={loading || !isOnline || otp.length !== 6}
            className="w-full bg-gradient-to-r from-brand-500 to-brand-600 text-white font-medium py-2.5 rounded-lg
                       hover:shadow-lg hover:shadow-brand-500/30 hover:-translate-y-0.5
                       active:translate-y-0 disabled:opacity-60 disabled:hover:translate-y-0 disabled:cursor-not-allowed
                       transition-all duration-200 flex items-center justify-center gap-2 text-sm"
          >
            {loading ? (
              <>
                <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                <span>Verifying code...</span>
              </>
            ) : (
              <>
                <span>Verify code</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-gray-100 flex flex-col items-center gap-3">
          <ResendTimer
            onResend={handleResendOtp}
            initialSeconds={30}
            disabled={loading}
            isOffline={!isOnline}
          />

          <p className="text-xs text-gray-500">
            Didn&apos;t receive it or wrong email?{' '}
            <Link
              to="/forgot-password"
              className="font-medium text-brand-600 hover:text-brand-700 underline transition-colors"
            >
              Change email
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default VerifyOtpPage;
