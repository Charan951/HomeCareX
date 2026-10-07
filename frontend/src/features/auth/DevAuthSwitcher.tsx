import React from 'react';
import { useAuth } from '@/context/AuthContext';

export const DevAuthSwitcher: React.FC = () => {
  const { user, logout } = useAuth();
  if (process.env.NODE_ENV === 'production') return null;

  return (
    <div className="fixed bottom-3 right-3 z-[100] flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-md">
      <span className="hidden text-slate-500 sm:inline">AUTH STATUS:</span>
      <span className="capitalize">{user ? `${user.role} (${user.name})` : 'Logged Out'}</span>
      {user && (
        <button
          type="button"
          onClick={() => void logout()}
          className="ml-1 text-[11px] text-red-600 hover:underline"
        >
          Logout
        </button>
      )}
    </div>
  );
};

export default DevAuthSwitcher;
