import React from 'react';
import { Route, Routes } from 'react-router-dom';
import AdminLayout from '@/layouts/AdminLayout';
import { RequirePermission } from '@/components/admin/PermissionGate';

import AdminDashboardPage from '@/pages/admin/Dashboard';
import AdminLeadsPage from '@/pages/admin/Leads';
import AdminBookingsPage from '@/pages/admin/Bookings';
import AdminCustomersPage from '@/pages/admin/Customers';
import AdminCustomerDetailsPage from '@/pages/admin/CustomerDetails';
import AdminPartnersPage from '@/pages/admin/Partners';
import AdminManagePartnersPage from '@/pages/admin/ManagePartners';
import AdminSupportPage from '@/pages/admin/Support';
import AdminCategoriesPage from '@/pages/admin/Categories';
import AdminServicesPage from '@/pages/admin/Services';
import AdminPricingPage from '@/pages/admin/Pricing';
import AdminCouponsPage from '@/pages/admin/Coupons';
import AdminMarketingPage from '@/pages/admin/Marketing';
import AdminPaymentsPage from '@/pages/admin/Payments';
import AdminRefundsPage from '@/pages/admin/Refunds';
import AdminPayoutsPage from '@/pages/admin/Payouts';
import AdminReviewsPage from '@/pages/admin/Reviews';
import AdminReportsPage from '@/pages/admin/Reports';
import AdminRolesPermissionsPage from '@/pages/admin/RolesPermissions';
import AdminStaffPage from '@/pages/admin/Staff';
import AdminAuditLogsPage from '@/pages/admin/AuditLogs';
import AdminSettingsPage from '@/pages/admin/Settings';
import AdminProfilePage from '@/pages/admin/Profile';
import AdminNotificationsPage from '@/pages/admin/Notifications';
import AdminPartnerDetailsPage from '@/pages/admin/PartnerDetails';

interface AdminRoute {
  /** Relative to /admin. Empty string is the index route. */
  path: string;
  element: React.ReactElement;
  /** Permission key. Leave out until RBAC is wired; the route then stays open. */
  permission?: string;
}

// Admin routes
export const adminRoutes: AdminRoute[] = [
  { path: '', element: <AdminDashboardPage /> },

  // Operations
  { path: 'leads', element: <AdminLeadsPage /> },
  { path: 'bookings', element: <AdminBookingsPage /> },
  { path: 'customers', element: <AdminCustomersPage /> },
  { path: 'customers/:id', element: <AdminCustomerDetailsPage /> },
  { path: 'partners', element: <AdminPartnersPage /> },
  { path: 'manage-partners', element: <AdminManagePartnersPage /> },
  { path: 'partners/:id', element: <AdminPartnerDetailsPage /> },
  { path: 'support', element: <AdminSupportPage /> },

  // Catalog
  { path: 'categories', element: <AdminCategoriesPage /> },
  { path: 'services', element: <AdminServicesPage /> },
  { path: 'pricing', element: <AdminPricingPage /> },

  // Coupons
  { path: 'coupons', element: <AdminCouponsPage /> },
  { path: 'coupons/create', element: <AdminCouponsPage /> },
  { path: 'coupons/:id/edit', element: <AdminCouponsPage /> },

  // Marketing
  { path: 'marketing', element: <AdminMarketingPage /> },
{ path: 'marketing/create', element: <AdminMarketingPage /> },
{ path: 'marketing/:id/edit', element: <AdminMarketingPage /> },

  // Finance
  { path: 'payments', element: <AdminPaymentsPage /> },
  { path: 'refunds', element: <AdminRefundsPage /> },
  { path: 'payouts', element: <AdminPayoutsPage /> },

  // Quality + Reporting
  { path: 'reviews', element: <AdminReviewsPage /> },
  { path: 'reports', element: <AdminReportsPage /> },

  // System
  { path: 'roles-permissions', element: <AdminRolesPermissionsPage /> },
  { path: 'staff', element: <AdminStaffPage /> },
  { path: 'audit-logs', element: <AdminAuditLogsPage /> },
  { path: 'settings', element: <AdminSettingsPage /> },

  // Header-only pages
  { path: 'profile', element: <AdminProfilePage /> },
  { path: 'notifications', element: <AdminNotificationsPage /> },
];

const NotFound: React.FC = () => (
  <div className="admin-page-container">
    <h1 className="hcx-page-header__title">Page not found</h1>
    <p className="hcx-page-header__desc">
      That admin page doesn&apos;t exist.
    </p>
  </div>
);

export const AdminRoutes: React.FC = () => (
  <Routes>
    <Route element={<AdminLayout />}>
      {adminRoutes.map(({ path, element, permission }) => {
        const guarded = permission ? (
          <RequirePermission permission={permission}>
            {element}
          </RequirePermission>
        ) : (
          element
        );

        return path === '' ? (
          <Route key="index" index element={guarded} />
        ) : (
          <Route key={path} path={path} element={guarded} />
        );
      })}

      <Route path="*" element={<NotFound />} />
    </Route>
  </Routes>
);

export default AdminRoutes;
