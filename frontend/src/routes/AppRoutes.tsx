import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import AdminRoutes from './AdminRoutes';
import PartnerRoutes from './PartnerRoutes';

import CustomerRoutes from './CustomerRoutes';
import PublicRoutes from "./PublicRoutes";

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Admin */}
      <Route path="/admin/*" element={<AdminRoutes />} />
      <Route path="/partner/*" element={<PartnerRoutes />} />
      <Route path="/" element={<PublicRoutes />} />
      <Route path="/customer/*" element={<CustomerRoutes />} />
      <Route path="/*" element={<PublicRoutes />} />
    </Routes>
  );
};

export default AppRoutes;