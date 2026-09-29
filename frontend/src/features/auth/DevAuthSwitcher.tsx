import React from 'react';

import { useAuth } from './AuthProvider';
import { buildMockAuthUser } from './mockAuthProvider';
import type { AuthenticatedRole } from './auth.types';

const DevAuthSwitcher: React.FC = () => {
  const { role, login, logout } = useAuth();
  const roles: Record<string, AuthenticatedRole> = {
    CUSTOMER: 'CUSTOMER',
    PARTNER: 'PARTNER',
    ADMIN: 'ADMIN',
  };

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedRole = event.target.value;

    if (selectedRole === '') {
      logout();
      return;
    }

    const authenticatedRole = roles[selectedRole];
    if (authenticatedRole) {
      login(buildMockAuthUser(authenticatedRole), authenticatedRole);
    }
  };

  return (
    <label className="fixed bottom-3 right-3 z-[100] flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-md">
      <span className="hidden text-slate-500 sm:inline">AUTH DEV</span>
      <select
        aria-label="Development authentication role"
        value={role ?? ''}
        onChange={handleChange}
        className="max-w-32 border-0 bg-transparent py-1 text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">Logged Out</option>
        <option value="CUSTOMER">Customer</option>
        <option value="PARTNER">Partner</option>
        <option value="ADMIN">Admin</option>
      </select>
    </label>
  );
};

export default DevAuthSwitcher;
