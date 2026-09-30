// The single place that lists every admin page.
// Add a page here once and it shows up in the sidebar, the header search
// and the breadcrumbs automatically.

import {
  BarChart3,
  Bell,
  CalendarCheck,
  CreditCard,
  FileClock,
  HardHat,
  Headset,
  UserCog,
  LayoutDashboard,
  LayoutGrid,
  Megaphone,
  RotateCcw,
  Settings,
  ShieldCheck,
  Star,
  Tag,
  Ticket,
  UserCircle,
  Users,
  Wallet,
  Wrench,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface AdminNavItem {
  label: string;
  path: string;
  icon: LucideIcon;
  /** Optional permission key. When set, PermissionGate / RequirePermission use it. */
  permission?: string;
}

export interface AdminNavGroup {
  groupName: string;
  items: AdminNavItem[];
  /** `hidden` groups are not drawn in the sidebar but still feed breadcrumbs + search. */
  hidden?: boolean;
}

export const adminNavGroups: AdminNavGroup[] = [
  {
    groupName: 'Overview',
    items: [{ label: 'Dashboard', path: '/admin', icon: LayoutDashboard }],
  },
  {
    groupName: 'Operations',
    items: [
      { label: 'Bookings', path: '/admin/bookings', icon: CalendarCheck },
      { label: 'Customers', path: '/admin/customers', icon: Users },
      { label: 'Partners & KYC', path: '/admin/partners', icon: HardHat },
      { label: 'Support', path: '/admin/support', icon: Headset },
    ],
  },
  {
    groupName: 'Catalog',
    items: [
      { label: 'Categories', path: '/admin/categories', icon: LayoutGrid },
      { label: 'Services', path: '/admin/services', icon: Wrench },
      { label: 'Pricing', path: '/admin/pricing', icon: Tag },
      { label: 'Coupons', path: '/admin/coupons', icon: Ticket },
      { label: 'Marketing', path: '/admin/marketing', icon: Megaphone },
    ],
  },
  {
    groupName: 'Finance',
    items: [
      { label: 'Payments', path: '/admin/payments', icon: CreditCard },
      { label: 'Refunds', path: '/admin/refunds', icon: RotateCcw },
      { label: 'Payouts', path: '/admin/payouts', icon: Wallet },
    ],
  },
  {
    groupName: 'Quality',
    items: [{ label: 'Reviews', path: '/admin/reviews', icon: Star }],
  },
  {
    groupName: 'Reporting',
    items: [{ label: 'Reports', path: '/admin/reports', icon: BarChart3 }],
  },
  {
    groupName: 'System',
    items: [
      { label: 'Roles', path: '/admin/roles-permissions', icon: ShieldCheck },
      { label: 'Staff', path: '/admin/staff', icon: UserCog },
      { label: 'Audit Logs', path: '/admin/audit-logs', icon: FileClock },
      { label: 'Settings', path: '/admin/settings', icon: Settings },
    ],
  },
  {
    // Reachable from the header only.
    groupName: 'Account',
    hidden: true,
    items: [
      { label: 'My Profile', path: '/admin/profile', icon: UserCircle },
      { label: 'Notifications', path: '/admin/notifications', icon: Bell },
    ],
  },
];

export interface AdminPage extends AdminNavItem {
  groupName: string;
}

/** Flat list of every page, used by search + breadcrumbs. */
export const allAdminPages: AdminPage[] = adminNavGroups.flatMap((group) =>
  group.items.map((item) => ({ ...item, groupName: group.groupName })),
);

/**
 * Finds the page for a pathname. Exact match first, then the longest page path
 * that is a prefix (so /admin/bookings/BK-1 resolves to Bookings).
 */
export function findAdminPage(pathname: string): AdminPage | undefined {
  const clean = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  const exact = allAdminPages.find((page) => page.path === clean);
  if (exact) return exact;
  return allAdminPages
    .filter((page) => page.path !== '/admin' && clean.startsWith(`${page.path}/`))
    .sort((a, b) => b.path.length - a.path.length)[0];
}