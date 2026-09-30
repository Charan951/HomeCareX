import React from 'react';
import { Route, Routes } from 'react-router-dom';
import AdminLayout from '@/layouts/AdminLayout';

import AdminDashboardPage from '@/pages/admin/Dashboard';
import AdminProfilePage from '@/pages/admin/Profile';
import AdminReportsPage from '@/pages/admin/Reports';
import AdminBookingsPage from '@/pages/admin/Bookings';
import AdminCustomersPage from '@/pages/admin/Customers';
import AdminPartnersPage from '@/pages/admin/Partners';
import AdminCategoriesPage from '@/pages/admin/Categories';
import AdminServicesPage from '@/pages/admin/Services';
import AdminPricingPage from '@/pages/admin/Pricing';
import AdminCouponsPage from '@/pages/admin/Coupons';
import AdminMarketingPage from '@/pages/admin/Marketing';
import AdminPaymentsPage from '@/pages/admin/Payments';
import AdminPayoutsPage from '@/pages/admin/Payouts';
import AdminRefundsPage from '@/pages/admin/Refunds';
import AdminSupportPage from '@/pages/admin/Support';
import AdminRolesPermissionsPage from '@/pages/admin/RolesPermissions';
import AdminAuditLogsPage from '@/pages/admin/AuditLogs';
import AdminSettingsPage from '@/pages/admin/Settings';
<<<<<<< Updated upstream
=======
import AdminProfilePage from '@/pages/admin/Profile';
import AdminNotificationsPage from '@/pages/admin/Notifications';
import AdminLeadsPage from '@/pages/admin/Leads';
>>>>>>> Stashed changes

export const AdminRoutes: React.FC = () => {
  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route index element={<AdminDashboardPage />} />
        <Route path="profile" element={<AdminProfilePage />} />
        <Route path="reports" element={<AdminReportsPage />} />
        <Route path="bookings" element={<AdminBookingsPage />} />
        <Route path="customers" element={<AdminCustomersPage />} />
        <Route path="partners" element={<AdminPartnersPage />} />
        <Route path="categories" element={<AdminCategoriesPage />} />
        <Route path="services" element={<AdminServicesPage />} />
        <Route path="pricing" element={<AdminPricingPage />} />
        <Route path="coupons" element={<AdminCouponsPage />} />
        <Route path="marketing" element={<AdminMarketingPage />} />
        <Route path="payments" element={<AdminPaymentsPage />} />
        <Route path="payouts" element={<AdminPayoutsPage />} />
        <Route path="refunds" element={<AdminRefundsPage />} />
        <Route path="support" element={<AdminSupportPage />} />
        <Route path="roles-permissions" element={<AdminRolesPermissionsPage />} />
        <Route path="audit-logs" element={<AdminAuditLogsPage />} />
        <Route path="settings" element={<AdminSettingsPage />} />
        <Route path="*" element={<h1 className="p-6 text-xl font-bold">Page not found</h1>} />
      </Route>
    </Routes>
  );
};

<<<<<<< Updated upstream
export default AdminRoutes;
=======
// 21 routes. To swap a placeholder for a real page, change only its `element` import.
export const adminRoutes: AdminRoute[] = [
  { path: '', element: <AdminDashboardPage /> },
  // Operations
  { path: 'bookings', element: <AdminBookingsPage /> },
  { path: 'customers', element: <AdminCustomersPage /> },
  { path: 'partners', element: <AdminPartnersPage /> },
  { path: 'support', element: <AdminSupportPage /> },
  { path: 'leads', element: <AdminLeadsPage />, permission: 'leads:read' },
  // Catalog
  { path: 'categories', element: <AdminCategoriesPage /> },
  { path: 'services', element: <AdminServicesPage /> },
  { path: 'pricing', element: <AdminPricingPage /> },
  { path: 'coupons', element: <AdminCouponsPage /> },
  { path: 'marketing', element: <AdminMarketingPage /> },
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
    <p className="hcx-page-header__desc">That admin page doesn&apos;t exist.</p>
  </div>
);

export const AdminRoutes: React.FC = () => (
  <Routes>
    <Route element={<AdminLayout />}>
      {adminRoutes.map(({ path, element, permission }) => {
        const guarded = permission ? <RequirePermission permission={permission}>{element}</RequirePermission> : element;
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
>>>>>>> Stashed changes
