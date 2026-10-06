import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, ArrowRight, ArrowLeft, ShieldCheck, AlertCircle, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { classifyApiError } from '@/lib/apiError';
import { ADMIN_ROLES, type AuthUser } from '@/types/auth';
import { ROUTES } from '@/constants/routes';
import PasswordField from '@/components/auth/PasswordField';

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
const PHONE_RE = /^[6-9]\d{9}$/;

const REMEMBERED_CREDS_KEY = 'homecarex_remembered_credentials';

interface SavedCredentials {
  identifier: string;
  password: string;
}

function getSavedCredentials(): SavedCredentials | null {
  try {
    const raw = localStorage.getItem(REMEMBERED_CREDS_KEY);
    if (!raw) {
      // Legacy fallback: check for previous identifier-only key
      const legacyId = localStorage.getItem('homecarex_remembered_identifier');
      return legacyId ? { identifier: legacyId, password: '' } : null;
    }
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.identifier === 'string') {
      let decodedPassword = '';
      if (parsed.password) {
        try {
          decodedPassword = atob(parsed.password);
        } catch {
          decodedPassword = parsed.password;
        }
      }
      return {
        identifier: parsed.identifier,
        password: decodedPassword,
      };
    }
  } catch {
    // Ignore storage parse errors
  }
  return null;
}

function saveCredentials(identifier: string, password: string) {
  try {
    const encoded = btoa(password);
    localStorage.setItem(
      REMEMBERED_CREDS_KEY,
      JSON.stringify({ identifier, password: encoded })
    );
  } catch {
    // Ignore storage write errors in restricted contexts
  }
}

function clearCredentials() {
  try {
    localStorage.removeItem(REMEMBERED_CREDS_KEY);
    localStorage.removeItem('homecarex_remembered_identifier');
  } catch {
    // Ignore storage errors
  }
}

export const LoginPage: React.FC = () => {
  const { login, logout, user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const returnUrl = safeReturnUrl(params.get('returnUrl'));

  // Initialize directly from stored credentials so fields are instantly autofilled
  const [initialCreds] = useState<SavedCredentials | null>(() => getSavedCredentials());
  const [identifier, setIdentifier] = useState(initialCreds?.identifier ?? '');
  const [password, setPassword] = useState(initialCreds?.password ?? '');
  const [rememberMe, setRememberMe] = useState(Boolean(initialCreds));
  const [termsAccepted, setTermsAccepted] = useState(Boolean(initialCreds));
  const [error, setError] = useState(params.get('expired') ? 'Your session has expired. Please log in again.' : '');
  const [fieldErrors, setFieldErrors] = useState<{ identifier?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);
  const [errorStatus, setErrorStatus] = useState<number | null>(null);

  useEffect(() => {
    document.title = 'Log in | HomeCareX';
  }, []);

  // Autofill credentials when unauthenticated or after logging out
  useEffect(() => {
    if (!isAuthenticated) {
      const saved = getSavedCredentials();
      if (saved) {
        setIdentifier(saved.identifier);
        setPassword(saved.password);
        setRememberMe(true);
        setTermsAccepted(true);
      }
    }
  }, [isAuthenticated]);

  // Already signed in state
  if (isAuthenticated && user && !loading) {
    return (
      <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 p-6 sm:p-8">
        <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-[#4338ca] to-[#312e81] flex items-center justify-center shadow-md shadow-[#4338ca]/20 mb-4">
          <ShieldCheck size={22} className="text-white" aria-hidden="true" />
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">You&apos;re already signed in</h1>
        <p className="text-xs sm:text-sm text-gray-600 mb-6">
          Signed in as <b className="text-gray-900">{user.name}</b>
          {user.email ? ` (${user.email})` : ''} &middot; role: <b className="capitalize text-gray-900">{user.role}</b>
        </p>
        <div className="flex flex-col gap-3">
          <Link
            to={destinationFor(user, returnUrl)}
            className="w-full text-center rounded-lg bg-[#ff8a3d] hover:bg-[#e0600f] text-white font-medium py-2.5 shadow-sm hover:shadow-md hover:shadow-[#ff8a3d]/25 transition"
          >
            Continue to my dashboard
          </Link>
          <button
            type="button"
            onClick={() => void logout()}
            className="w-full rounded-lg border border-gray-300 py-2.5 font-medium text-gray-700 hover:bg-gray-50 transition"
          >
            Log out and use another account
          </button>
        </div>
      </div>
    );
  }

  function validate(): boolean {
    const nextErrors: { identifier?: string; password?: string } = {};
    const trimmed = identifier.trim();

    if (!trimmed) {
      nextErrors.identifier = 'Please enter your email or mobile number.';
    } else {
      const isCleanPhone = trimmed.replace(/[\s()-]/g, '').replace(/^(\+91|91)/, '');
      const isEmail = EMAIL_RE.test(trimmed);
      const isPhone = PHONE_RE.test(isCleanPhone);
      if (!isEmail && !isPhone) {
        nextErrors.identifier = 'Please enter a valid email or 10-digit mobile number.';
      }
    }

    if (!password) {
      nextErrors.password = 'Password is required.';
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setError('');
    setErrorStatus(null);

    if (!termsAccepted) {
      setError('Please accept the Terms & Conditions and Privacy Policy to continue.');
      return;
    }

    if (!validate()) {
      return;
    }

    setLoading(true);
    try {
      const trimmed = identifier.trim();
      const signedIn = await login({ email: trimmed, password });
      if (rememberMe) {
        saveCredentials(trimmed, password);
      } else {
        clearCredentials();
      }
      navigate(destinationFor(signedIn, returnUrl), { replace: true });
    } catch (err) {
      const classified = classifyApiError(err);
      setErrorStatus(classified.status ?? null);

      if (classified.kind === 'offline') {
        setError('Unable to reach the server. Please check your internet connection.');
      } else if (classified.kind === 'network') {
        setError('Unable to reach the server. Please check your connection and try again.');
      } else if (classified.kind === 'timeout') {
        setError('The server is taking too long to respond. Please check your connection and try again.');
      } else if (classified.status === 423) {
        setError('Your account is temporarily locked due to multiple failed login attempts. Please try again in 15 minutes.');
      } else if (classified.status === 429) {
        setError('Too many login attempts. Please wait a moment and try again.');
      } else if (classified.status === 401) {
        setError('Invalid email or password. Please try again.');
      } else if (classified.status && classified.status >= 500) {
        setError('A server error occurred. Please try again shortly.');
      } else {
        setError(classified.message || 'Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 p-5 sm:p-6 relative">
      {/* Top Navigation: Back to Home (logo removed from form) */}
      <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-gray-100">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-gray-500 hover:text-[#4338ca] hover:-translate-x-0.5 transition-all focus:outline-none focus:ring-2 focus:ring-[#4338ca] rounded px-1.5 py-0.5 -ml-1.5"
          aria-label="Back to Home"
        >
          <ArrowLeft size={16} />
          Back to Home
        </Link>
      </div>

      {/* Brand Icon Header */}
      <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-[#4338ca] to-[#312e81] flex items-center justify-center shadow-md shadow-[#4338ca]/20 mb-2">
        <ShieldCheck size={19} className="text-white" aria-hidden="true" />
      </div>

      <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 mb-0.5">
        Welcome back to <span className="text-[#4338ca]">HomeCare<span className="text-[#ff8a3d]">X</span></span>
      </h1>
      <p className="text-xs text-gray-500 mb-3.5">Sign in to manage your home care and connect with trusted services.</p>

      {error && (
        <div
          role="alert"
          id="login-error"
          className={`mb-4 text-xs sm:text-sm rounded-lg p-3 flex items-start gap-2.5 animate-fadeUp ${
            errorStatus === 423 || errorStatus === 429
              ? 'bg-amber-50 border border-amber-200 text-amber-800'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}
        >
          {errorStatus === 423 || errorStatus === 429 ? (
            <AlertTriangle size={17} className="shrink-0 mt-0.5 text-amber-600" aria-hidden="true" />
          ) : (
            <AlertCircle size={17} className="shrink-0 mt-0.5 text-red-500" aria-hidden="true" />
          )}
          <span className="leading-snug">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-2.5" noValidate aria-describedby={error ? 'login-error' : undefined}>
        {/* Email or Phone */}
        <div className="group">
          <label htmlFor="login-identifier" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
            Email or Phone Number <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#4338ca] transition-colors pointer-events-none">
              <Mail size={17} aria-hidden="true" />
            </div>
            <input
              id="login-identifier"
              type="text"
              name="identifier"
              autoComplete="username"
              autoFocus
              value={identifier}
              onChange={(e) => {
                setIdentifier(e.target.value);
                if (fieldErrors.identifier) setFieldErrors((prev) => ({ ...prev, identifier: undefined }));
              }}
              placeholder="you@example.com or 9876543210"
              aria-invalid={Boolean(fieldErrors.identifier)}
              aria-describedby={fieldErrors.identifier ? 'identifier-error' : undefined}
              className={`w-full rounded-lg border bg-white pl-9 sm:pl-10 pr-3 py-2 sm:py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#4338ca]/30 focus:border-[#4338ca] hover:border-gray-400 ${
                fieldErrors.identifier ? 'border-red-400 focus:ring-red-400/30 focus:border-red-500' : 'border-gray-300'
              }`}
            />
          </div>
          {fieldErrors.identifier && (
            <p id="identifier-error" role="alert" className="mt-1 text-xs text-red-600">
              {fieldErrors.identifier}
            </p>
          )}
        </div>

        {/* Password */}
        <PasswordField
          id="login-password"
          name="password"
          label="Password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (fieldErrors.password) setFieldErrors((prev) => ({ ...prev, password: undefined }));
          }}
          error={fieldErrors.password}
        />

        {/* Remember me & Forgot Password */}
        <div className="flex items-center justify-between pt-0.5">
          <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-600 select-none">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-gray-300 text-[#4338ca] focus:ring-2 focus:ring-[#4338ca]/30 cursor-pointer"
            />
            Remember me
          </label>
          <Link
            to="/forgot-password"
            className="text-xs text-[#4338ca] hover:text-[#312e81] font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-[#4338ca] rounded"
          >
            Forgot password?
          </Link>
        </div>

        {/* Terms & Conditions Consent */}
        <div className="flex items-start gap-2.5 pt-1">
          <input
            id="login-consent"
            type="checkbox"
            checked={termsAccepted}
            onChange={(e) => {
              setTermsAccepted(e.target.checked);
              if (e.target.checked && error === 'Please accept the Terms & Conditions and Privacy Policy to continue.') {
                setError('');
              }
            }}
            className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded border-gray-300 text-[#4338ca] focus:ring-2 focus:ring-[#4338ca]/30 cursor-pointer"
            aria-describedby="login-consent-label"
          />
          <label
            htmlFor="login-consent"
            id="login-consent-label"
            className="text-xs text-gray-600 leading-relaxed cursor-pointer select-none"
          >
            I agree to the{' '}
            <Link
              to={ROUTES.TERMS}
              onClick={(e) => e.stopPropagation()}
              className="text-[#4338ca] font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-[#4338ca] rounded"
            >
              Terms &amp; Conditions
            </Link>{' '}
            and{' '}
            <Link
              to={ROUTES.PRIVACY}
              onClick={(e) => e.stopPropagation()}
              className="text-[#4338ca] font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-[#4338ca] rounded"
            >
              Privacy Policy
            </Link>
            .
          </label>
        </div>

        {/* Submit CTA */}
        <button
          type="submit"
          disabled={loading || !termsAccepted}
          className="w-full bg-[#ff8a3d] hover:bg-[#e0600f] text-white font-medium py-2.5 rounded-lg shadow-sm hover:shadow-md hover:shadow-[#ff8a3d]/25 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-[#ff8a3d] focus:ring-offset-2"
          aria-label={!termsAccepted ? 'Sign In (accept terms to enable)' : 'Sign In'}
        >
          {loading ? (
            <>
              <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" aria-hidden="true" />
              <span>Signing in...</span>
            </>
          ) : (
            <>
              <span>Sign In</span>
              <ArrowRight size={16} aria-hidden="true" />
            </>
          )}
        </button>
      </form>

      <p className="text-center text-xs sm:text-sm text-gray-500 mt-3.5 sm:mt-4">
        Don&apos;t have an account?{' '}
        <Link to="/register" className="text-[#4338ca] font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-[#4338ca] rounded">
          Create an account
        </Link>
      </p>
    </div>
  );
};

export default LoginPage;