import React from 'react';
import { Route, Routes } from 'react-router-dom';
import AdminRoutes from './AdminRoutes';
import PartnerRoutes from './PartnerRoutes';
import CustomerRoutes from './CustomerRoutes';
import PublicRoutes from './PublicRoutes';
import ProtectedRoute from '@/components/ProtectedRoute';
import AuthLayout from '@/layouts/AuthLayout';
import LoginPage from '@/pages/public/Login';
import RegisterPage from '@/pages/public/Register';
import ForgotPasswordPage from '@/pages/public/ForgotPassword';
import VerifyOtpPage from '@/pages/public/VerifyOtp';
import ResetPasswordPage from '@/pages/public/ResetPassword';
import UnauthorizedPage from '@/pages/public/Unauthorized';
import { ADMIN_ROLES } from '@/types/auth';
 
const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Auth screens */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/verify-otp" element={<VerifyOtpPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
      </Route>
      <Route path="/unauthorized" element={<UnauthorizedPage />} />
 
      {/* Role-protected dashboards */}
      <Route path="/admin/*" element={<ProtectedRoute allowedRoles={ADMIN_ROLES}><AdminRoutes /></ProtectedRoute>} />
      <Route path="/partner/*" element={<ProtectedRoute allowedRoles={['partner']}><PartnerRoutes /></ProtectedRoute>} />
      <Route path="/customer/*" element={<ProtectedRoute allowedRoles={['customer']}><CustomerRoutes /></ProtectedRoute>} />
 
      {/* Public site (/, /services, /about, /contact) */}
      <Route path="/*" element={<PublicRoutes />} />
    </Routes>
  );
};
 
export default AppRoutes;