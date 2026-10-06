import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Phone, Tag, ArrowRight, ArrowLeft, UserCheck, AlertCircle, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { classifyApiError } from '@/lib/apiError';
import { ROUTES } from '@/constants/routes';
import PasswordField from '@/components/auth/PasswordField';
import PasswordStrength from '@/components/auth/PasswordStrength';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[6-9]\d{9}$/;

export const RegisterPage: React.FC = () => {
  const { register, user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    referralCode: '',
  });

  const [termsAccepted, setTermsAccepted] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [errorStatus, setErrorStatus] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    document.title = 'Create Account | HomeCareX';
  }, []);

  // If already authenticated
  if (isAuthenticated && user && !loading) {
    return (
      <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 p-6 sm:p-8">
        <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-[#4338ca] to-[#312e81] flex items-center justify-center shadow-md shadow-[#4338ca]/20 mb-4">
          <UserCheck size={22} className="text-white" aria-hidden="true" />
        </div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">Account already active</h1>
        <p className="text-xs sm:text-sm text-gray-600 mb-6">
          You are already signed in as <b className="text-gray-900">{user.name}</b> ({user.role}).
        </p>
        <Link
          to={user.home || (user.role === 'admin' ? '/admin' : `/${user.role}`)}
          className="w-full text-center block rounded-lg bg-[#ff8a3d] hover:bg-[#e0600f] text-white font-medium py-2.5 shadow-sm transition"
        >
          Go to my dashboard
        </Link>
      </div>
    );
  }

  function normalizePhone(raw: string): string {
    const cleaned = raw.replace(/[\s()-]/g, '');
    if (cleaned.startsWith('+91')) return cleaned.slice(3);
    if (cleaned.startsWith('91') && cleaned.length === 12) return cleaned.slice(2);
    return cleaned;
  }

  function validate(): boolean {
    const nextErrors: Record<string, string> = {};

    if (!form.name.trim()) {
      nextErrors.name = 'Full name is required.';
    } else if (form.name.trim().length < 2) {
      nextErrors.name = 'Name must be at least 2 characters.';
    }

    if (!form.email.trim()) {
      nextErrors.email = 'Email address is required.';
    } else if (!EMAIL_RE.test(form.email.trim())) {
      nextErrors.email = 'Please enter a valid email address.';
    }

    const cleanedPhone = normalizePhone(form.phone);
    if (!form.phone.trim()) {
      nextErrors.phone = 'Phone number is required.';
    } else if (!PHONE_RE.test(cleanedPhone)) {
      nextErrors.phone = 'Please enter a valid 10-digit Indian mobile number.';
    }

    if (!form.password) {
      nextErrors.password = 'Password is required.';
    } else if (form.password.length < 8) {
      nextErrors.password = 'Password must be at least 8 characters.';
    } else if (!/[A-Z]/.test(form.password)) {
      nextErrors.password = 'Password requires at least one uppercase letter.';
    } else if (!/[0-9]/.test(form.password)) {
      nextErrors.password = 'Password requires at least one number.';
    }

    if (!form.confirmPassword) {
      nextErrors.confirmPassword = 'Please confirm your password.';
    } else if (form.password !== form.confirmPassword) {
      nextErrors.confirmPassword = 'Passwords do not match.';
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  function handleChange(field: string, value: string | boolean) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const copy = { ...prev };
        delete copy[field];
        return copy;
      });
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setError('');
    setErrorStatus(null);

    if (!termsAccepted) {
      setError('Please accept the Terms & Conditions and Privacy Policy to create an account.');
      return;
    }

    if (!validate()) {
      return;
    }

    setLoading(true);
    try {
      const cleanedPhone = normalizePhone(form.phone);

      const newUser = await register({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: cleanedPhone,
        password: form.password,
        confirmPassword: form.confirmPassword,
        referralCode: form.referralCode.trim() || undefined,
        role: 'customer',
      });

      const landingPath = newUser.home || (newUser.role === 'admin' ? '/admin' : `/${newUser.role}`);
      navigate(landingPath, { replace: true });
    } catch (err) {
      const classified = classifyApiError(err);
      setErrorStatus(classified.status ?? null);

      if (classified.kind === 'offline') {
        setError('Unable to connect to the server. Please check your internet connection.');
      } else if (classified.kind === 'network') {
        setError('Unable to connect to the server. Please check your connection and try again.');
      } else if (classified.kind === 'timeout') {
        setError('The server is taking too long to respond. Please check your connection and try again.');
      } else if (classified.status === 409) {
        setError('An account with this email or mobile number already exists. Please sign in instead.');
      } else if (classified.status === 429) {
        setError('Too many registration attempts. Please wait a moment and try again.');
      } else if (classified.status && classified.status >= 500) {
        setError('A server error occurred. Please try again shortly.');
      } else {
        setError(classified.message || 'Registration failed. Please check your details and try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 p-4 sm:p-5 relative">
      {/* Top Navigation: Back to Home + Status badge */}
      <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-gray-100">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-[#4338ca] hover:-translate-x-0.5 transition-all focus:outline-none focus:ring-2 focus:ring-[#4338ca] rounded px-1.5 py-0.5 -ml-1.5"
          aria-label="Back to Home"
        >
          <ArrowLeft size={15} />
          Back to Home
        </Link>
        <span className="text-[11px] font-medium text-gray-400 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-full">
          Create Account
        </span>
      </div>

      {/* Header */}
      <div className="mb-2">
        <div className="flex items-center gap-2 mb-0.5">
          <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-[#4338ca] to-[#312e81] flex items-center justify-center shadow-sm shadow-[#4338ca]/20 shrink-0">
            <UserCheck size={15} className="text-white" aria-hidden="true" />
          </div>
          <h1 className="text-lg sm:text-xl font-extrabold text-gray-900 leading-tight">
            Create your <span className="text-[#4338ca]">HomeCare<span className="text-[#ff8a3d]">X</span></span> account
          </h1>
        </div>
        <p className="text-[11px] text-gray-500">
          Join HomeCareX to book trusted home services
        </p>
      </div>

      {error && (
        <div
          role="alert"
          id="register-error"
          className={`mb-2 text-xs rounded-lg p-2 flex items-start gap-2 animate-fadeUp ${
            errorStatus === 409 || errorStatus === 429
              ? 'bg-amber-50 border border-amber-200 text-amber-800'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}
        >
          {errorStatus === 409 || errorStatus === 429 ? (
            <AlertTriangle size={15} className="shrink-0 mt-0.5 text-amber-600" aria-hidden="true" />
          ) : (
            <AlertCircle size={15} className="shrink-0 mt-0.5 text-red-500" aria-hidden="true" />
          )}
          <span className="leading-snug">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-2" noValidate aria-describedby={error ? 'register-error' : undefined}>
        {/* Full Name */}
        <div className="group">
          <label htmlFor="register-name" className="block text-xs font-medium text-gray-700 mb-1">
            Full Name <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#4338ca] transition-colors pointer-events-none">
              <User size={15} aria-hidden="true" />
            </div>
            <input
              id="register-name"
              type="text"
              name="name"
              autoComplete="name"
              value={form.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Priya Sharma"
              aria-invalid={Boolean(fieldErrors.name)}
              aria-describedby={fieldErrors.name ? 'name-error' : undefined}
              className={`w-full rounded-lg border bg-white pl-8 sm:pl-9 pr-2.5 py-1.5 sm:py-2 text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#4338ca]/30 focus:border-[#4338ca] hover:border-gray-400 ${
                fieldErrors.name ? 'border-red-400 focus:ring-red-400/30 focus:border-red-500' : 'border-gray-300'
              }`}
            />
          </div>
          {fieldErrors.name && (
            <p id="name-error" role="alert" className="mt-0.5 text-[11px] text-red-600">
              {fieldErrors.name}
            </p>
          )}
        </div>

        {/* Email & Phone in 2 columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {/* Email */}
          <div className="group">
            <label htmlFor="register-email" className="block text-xs font-medium text-gray-700 mb-1">
              Email Address <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#4338ca] transition-colors pointer-events-none">
                <Mail size={15} aria-hidden="true" />
              </div>
              <input
                id="register-email"
                type="email"
                name="email"
                autoComplete="email"
                value={form.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="priya@example.com"
                aria-invalid={Boolean(fieldErrors.email)}
                aria-describedby={fieldErrors.email ? 'email-error' : undefined}
                className={`w-full rounded-lg border bg-white pl-8 sm:pl-9 pr-2.5 py-1.5 sm:py-2 text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#4338ca]/30 focus:border-[#4338ca] hover:border-gray-400 ${
                  fieldErrors.email ? 'border-red-400 focus:ring-red-400/30 focus:border-red-500' : 'border-gray-300'
                }`}
              />
            </div>
            {fieldErrors.email && (
              <p id="email-error" role="alert" className="mt-0.5 text-[11px] text-red-600">
                {fieldErrors.email}
              </p>
            )}
          </div>

          {/* Phone */}
          <div className="group">
            <label htmlFor="register-phone" className="block text-xs font-medium text-gray-700 mb-1">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#4338ca] transition-colors pointer-events-none">
                <Phone size={15} aria-hidden="true" />
              </div>
              <input
                id="register-phone"
                type="tel"
                name="phone"
                autoComplete="tel"
                value={form.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="9876543210"
                aria-invalid={Boolean(fieldErrors.phone)}
                aria-describedby={fieldErrors.phone ? 'phone-error' : undefined}
                className={`w-full rounded-lg border bg-white pl-8 sm:pl-9 pr-2.5 py-1.5 sm:py-2 text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#4338ca]/30 focus:border-[#4338ca] hover:border-gray-400 ${
                  fieldErrors.phone ? 'border-red-400 focus:ring-red-400/30 focus:border-red-500' : 'border-gray-300'
                }`}
              />
            </div>
            {fieldErrors.phone && (
              <p id="phone-error" role="alert" className="mt-0.5 text-[11px] text-red-600">
                {fieldErrors.phone}
              </p>
            )}
          </div>
        </div>

        {/* Password & Confirm Password in 2 columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div>
            <PasswordField
              id="register-password"
              name="password"
              label="Password"
              required
              autoComplete="new-password"
              value={form.password}
              onChange={(e) => handleChange('password', e.target.value)}
              error={fieldErrors.password}
              className="!py-1.5 sm:!py-2 text-xs sm:text-sm"
            />
            {/* Compact Password Strength Indicator */}
            <PasswordStrength password={form.password} />
          </div>

          <div>
            <PasswordField
              id="register-confirm-password"
              name="confirmPassword"
              label="Confirm Password"
              required
              autoComplete="new-password"
              value={form.confirmPassword}
              onChange={(e) => handleChange('confirmPassword', e.target.value)}
              error={fieldErrors.confirmPassword}
              className="!py-1.5 sm:!py-2 text-xs sm:text-sm"
            />
          </div>
        </div>

        {/* Referral Code (Optional) - placed directly after Confirm Password */}
        <div className="group">
          <label htmlFor="register-referral" className="block text-xs font-medium text-gray-700 mb-1">
            Referral Code <span className="text-gray-400 text-[10px] font-normal">(Optional)</span>
          </label>
          <div className="relative">
            <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#4338ca] transition-colors pointer-events-none">
              <Tag size={15} aria-hidden="true" />
            </div>
            <input
              id="register-referral"
              type="text"
              name="referralCode"
              value={form.referralCode}
              onChange={(e) => handleChange('referralCode', e.target.value.toUpperCase())}
              placeholder="e.g. CAREX2026"
              className="w-full rounded-lg border border-gray-300 bg-white pl-8 sm:pl-9 pr-2.5 py-1.5 sm:py-2 text-xs sm:text-sm text-gray-900 uppercase placeholder:normal-case placeholder:text-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#4338ca]/30 focus:border-[#4338ca] hover:border-gray-400"
            />
          </div>
        </div>

        {/* Terms & Conditions Consent */}
        <div className="flex items-start gap-2 pt-0.5">
          <input
            id="register-consent"
            type="checkbox"
            checked={termsAccepted}
            onChange={(e) => {
              setTermsAccepted(e.target.checked);
              if (e.target.checked && error.includes('Terms & Conditions')) {
                setError('');
              }
            }}
            className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded border-gray-300 text-[#4338ca] focus:ring-2 focus:ring-[#4338ca]/30 cursor-pointer"
            aria-describedby="register-consent-label"
          />
          <label
            htmlFor="register-consent"
            id="register-consent-label"
            className="text-[11px] sm:text-xs text-gray-600 leading-snug cursor-pointer select-none"
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

        {/* Primary CTA */}
        <button
          type="submit"
          disabled={loading || !termsAccepted}
          className="w-full bg-[#ff8a3d] hover:bg-[#e0600f] text-white font-medium py-2 sm:py-2.5 rounded-lg shadow-sm hover:shadow-md hover:shadow-[#ff8a3d]/25 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-[#ff8a3d] focus:ring-offset-2 text-sm"
          aria-label={!termsAccepted ? 'Create Account (accept terms to enable)' : 'Create Account'}
        >
          {loading ? (
            <>
              <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" aria-hidden="true" />
              <span>Creating account...</span>
            </>
          ) : (
            <>
              <span>Create Account</span>
              <ArrowRight size={15} aria-hidden="true" />
            </>
          )}
        </button>
      </form>

      <p className="text-center text-xs text-gray-500 mt-2">
        Already have an account?{' '}
        <Link to="/login" className="text-[#4338ca] font-medium hover:underline focus:outline-none focus:ring-2 focus:ring-[#4338ca] rounded">
          Sign in
        </Link>
      </p>
    </div>
  );
};

export default RegisterPage;