// This file is the single place that lists every admin page.
// Add a page here once, and it shows up in the sidebar, the search box,
// and the breadcrumbs automatically.

import {
  BarChart3,
  CalendarCheck,
  CreditCardIcon,
  HardHat,
  LayoutDashboard,
  LayoutGrid,
<<<<<<< Updated upstream
  LifeBuoy,
  ScrollText,
=======
  Mail,
  Megaphone,
  RotateCcw,
>>>>>>> Stashed changes
  Settings,
  UserCircle,
  Users,
} from 'lucide-react';

// A single nav link: label to show, path to go to, icon to display
export interface AdminNavItem {
  label: string;
  path: string;
  icon: typeof LayoutDashboard; // every icon imported above has this same type
}

// A group is a heading + a few links under it.
// `collapsible` groups render as a dropdown: clicking the heading opens/closes
// the item list beneath it. `defaultOpen` controls whether it starts expanded.
// `hidden` groups are never drawn in the sidebar, but still count for
// breadcrumbs + the topbar search (used for pages like "My Profile").
export interface AdminNavGroup {
  groupName: string;
  items: AdminNavItem[];
  collapsible?: boolean;
  defaultOpen?: boolean;
  hidden?: boolean;
}

// NOTE: This build only fleshes out the sections owned by the
// "Admin Dashboard - Core & Analytics" scope: layout, dashboard KPIs,
// customers, partners/KYC, audit logs, reports, and settings.
// Catalog and Finance belong to other modules, so their sidebar entries are
// kept to a single placeholder link each (no extra fields) instead of being
// built out in full here.
export const adminNavGroups: AdminNavGroup[] = [
  {
    groupName: 'Overview',
    collapsible: true,
    defaultOpen: true,
    items: [
      { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
      { label: 'Reports', path: '/admin/reports', icon: BarChart3 },
    ],
  },
  {
    groupName: 'Operations',
    collapsible: true,
    defaultOpen: true,
    items: [
      { label: 'Bookings', path: '/admin/bookings', icon: CalendarCheck },
      { label: 'Customers', path: '/admin/customers', icon: Users },
<<<<<<< Updated upstream
      { label: 'Partners', path: '/admin/partners', icon: HardHat },
=======
      { label: 'Partners & KYC', path: '/admin/partners', icon: HardHat },
      { label: 'Support', path: '/admin/support', icon: Headset },
      { label: 'Inbox', path: '/admin/leads', icon: Mail, permission: 'leads:read' },
>>>>>>> Stashed changes
    ],
  },
  {
    groupName: 'Catalog',
    collapsible: true,
    defaultOpen: false,
    // Owned by another module — one link only, no extra fields here.
    items: [{ label: 'Categories', path: '/admin/categories', icon: LayoutGrid }],
  },
  {
    groupName: 'Finance',
    collapsible: true,
    defaultOpen: false,
    // Owned by another module — just a Settings placeholder for now.
    items: [{ label: 'Payments', path: '/admin/payments', icon:CreditCardIcon }],
  },
  {
<<<<<<< Updated upstream
    groupName: 'Support',
    collapsible: true,
    defaultOpen: true,
    items: [{ label: 'Support Tickets', path: '/admin/support', icon: LifeBuoy }],
=======
    groupName: 'Reporting',
    items: [{ label: 'Reports', path: '/admin/reports', icon: BarChart3 }],
>>>>>>> Stashed changes
  },
  {
    groupName: 'Quality',
    hidden: true,
    items: [{ label: 'Customer Reviews', path: '/admin/reviews', icon: Star }],
  },
  {
    groupName: 'System',
    collapsible: true,
    defaultOpen: true,
    items: [
      { label: 'Audit Logs', path: '/admin/audit-logs', icon: ScrollText },
      { label: 'Settings', path: '/admin/settings', icon: Settings },
    ],
  },
  {
    groupName: 'Account',
    hidden: true,
    items: [{ label: 'My Profile', path: '/admin/profile', icon: UserCircle }],
  },
];

// Handy flat list of every page (used by search + breadcrumbs) —
// this just unpacks all the "items" arrays above into one big array.
export const allAdminPages = adminNavGroups.flatMap((group) =>
  group.items.map((item) => ({ ...item, groupName: group.groupName })),
);