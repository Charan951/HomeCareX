import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import type { AuthContextValue, AuthUser, UserRole } from './auth.types';
import { SESSION_EXPIRED_EVENT } from './sessionEvents';

const AuthContext = createContext<AuthContextValue | null>(null);

export { emitSessionExpired, SESSION_EXPIRED_EVENT } from './sessionEvents';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [role, setRoleState] = useState<UserRole>(null);

  const clearSession = useCallback(() => {
    setUser(null);
    setRoleState(null);
  }, []);

  const login = useCallback((nextUser: AuthUser, nextRole: Exclude<UserRole, null>) => {
    setUser(nextUser);
    setRoleState(nextRole);
  }, []);

  const logout = useCallback(() => {
    clearSession();
  }, [clearSession]);

  useEffect(() => {
    const handleSessionExpired = () => {
      clearSession();
    };

    window.addEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);

    return () => {
      window.removeEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
    };
  }, [clearSession]);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    role,
    isAuthenticated: Boolean(user && role),
    login,
    logout,
  }), [login, logout, role, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};
