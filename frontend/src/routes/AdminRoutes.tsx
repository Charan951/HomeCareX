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

export default AdminRoutes;