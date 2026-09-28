import { useAuthStore } from '@/store/useAuthStore';

export type PermissionMatch = 'any' | 'all';

/**
 * Reads permissions from the signed-in user (`user.permissions: string[]`).
 * `super_admin` role or a `'*'` permission passes every check.
 * An empty/undefined requirement always passes, so pages without a permission
 * key stay visible until RBAC is wired to real data.
 */
export function usePermissions() {
  const user = useAuthStore((state) => state.user);
  const granted = Array.isArray(user?.permissions) ? (user?.permissions as string[]) : [];
  const isSuperAdmin = user?.role === 'super_admin' || granted.includes('*');

  const can = (required?: string | string[], match: PermissionMatch = 'any'): boolean => {
    const list = required === undefined ? [] : Array.isArray(required) ? required : [required];
    if (list.length === 0 || isSuperAdmin) return true;
    return match === 'all'
      ? list.every((key) => granted.includes(key))
      : list.some((key) => granted.includes(key));
  };

  return { can, permissions: granted, isSuperAdmin };
}