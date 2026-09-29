import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import AdminRoutes from './AdminRoutes';
import PartnerRoutes from './PartnerRoutes';

import AdminRoutes from "./AdminRoutes";
import PublicRoutes from "./PublicRoutes";

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Admin */}
      <Route path="/admin/*" element={<AdminRoutes />} />
      <Route path="/partner/*" element={<PartnerRoutes />} />
      <Route path="/" element={<Navigate to="/admin" replace />} />
      <Route path="/customer/*" element={<CustomerRoutes />} />
    </Routes>
  );
};

export default AppRoutes;