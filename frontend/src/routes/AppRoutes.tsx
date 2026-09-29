import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import AdminRoutes from './AdminRoutes';
import CustomerRoutes from './CustomerRoutes';

import AdminRoutes from "./AdminRoutes";
import PublicRoutes from "./PublicRoutes";

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Admin */}
      <Route path="/admin/*" element={<AdminRoutes />} />
      <Route path="/" element={<Navigate to="/admin" replace />} />
      <Route path="/customer/*" element={<CustomerRoutes />} />
    </Routes>
  );
};

export default AppRoutes;