import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowRight, ArrowLeft, KeyRound, CheckCircle2 } from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!email) {
      setError('Please enter your email');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSent(true);
    }, 900);
  }

  return (
    <div>
      <Link
        to="/login"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-accent-700 transition-colors mb-4"
      >
        <ArrowLeft size={16} />
        Back to Login
      </Link>

      <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-[0_20px_60px_-15px_rgba(67,56,202,0.3)] border border-gray-100 p-8">
        {sent ? (
          <div className="text-center py-2 animate-fadeUp">
            <div className="h-12 w-12 rounded-xl bg-green-50 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={26} className="text-green-500" />
            </div>
            <h1 className="text-2xl font-bold text-accent-700 mb-1">Check your inbox</h1>
            <p className="text-gray-500 mb-6">
              We've sent a password reset link to <span className="font-medium text-gray-700">{email}</span>
            </p>
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 text-sm text-brand-600 font-medium hover:underline"
            >
              <ArrowLeft size={16} />
              Back to Login
            </Link>
          </div>
        ) : (
          <>
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shadow-lg shadow-brand-500/30 mb-5">
              <KeyRound size={22} className="text-white" />
            </div>

            <h1 className="text-2xl font-bold text-accent-700 mb-1">Forgot your password?</h1>
            <p className="text-gray-500 mb-6">
              Enter your email and we'll send you a link to reset it
            </p>

            {error && (
              <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 animate-fadeUp">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="group">
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <div className="relative">
                  <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-500 transition-colors" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded-lg border border-gray-300 pl-10 pr-3 py-2.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-400 hover:border-gray-400"
                  />
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
                    Sending link...
                  </>
                ) : (
                  <>
                    Send reset link
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordPage;