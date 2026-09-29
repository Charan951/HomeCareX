import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

/** 403: signed in, but the role can't open that page. */
export const UnauthorizedPage: React.FC = () => {
  const { user, logout } = useAuth();

  useEffect(() => {
    document.title = 'Access denied | HomeCareX';
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md text-center">
        <ShieldAlert size={40} className="mx-auto text-brand-600" aria-hidden="true" />
        <p className="mt-4 text-sm font-semibold text-gray-500">403</p>
        <h1 className="mt-1 text-2xl font-bold text-accent-700">Access denied</h1>
        <p className="mt-2 text-gray-600">You don&apos;t have permission to view this page.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link to="/" className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-white">
            Go home
          </Link>
          {user ? (
            <>
              <Link to={user.home} className="rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700">
                Go to my dashboard
              </Link>
              <button type="button" onClick={() => void logout()} className="rounded-lg px-4 py-2.5 text-sm font-medium text-brand-600 hover:underline">
                Switch account
              </button>
            </>
          ) : (
            <Link to="/login" className="rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700">
              Log in
            </Link>
          )}
        </div>
      </div>
    </main>
  );
};

export default UnauthorizedPage;
