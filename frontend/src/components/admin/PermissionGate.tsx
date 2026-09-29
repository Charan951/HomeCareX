import React from 'react';
import { Navigate } from 'react-router-dom';
import { usePermissions, type PermissionMatch } from '@/hooks/usePermissions';

interface PermissionGateProps {
  /** One permission key or a list. */
  permission: string | string[];
  /** With a list: `any` (default) needs one of them, `all` needs every one. */
  match?: PermissionMatch;
  /** Shown instead of children when access is denied. Default: nothing. */
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

/** Hides UI (a button, a column, a tab) unless the admin has the permission. */
export const PermissionGate: React.FC<PermissionGateProps> = ({ permission, match, fallback = null, children }) => {
  const { can } = usePermissions();
  return <>{can(permission, match) ? children : fallback}</>;
};

/** Route-level guard: sends the admin to /unauthorized (403) without the permission. */
export const RequirePermission: React.FC<Omit<PermissionGateProps, 'fallback'>> = ({ permission, match, children }) => {
  const { can } = usePermissions();
  return can(permission, match) ? <>{children}</> : <Navigate to="/unauthorized" replace />;
};

export default PermissionGate;
