import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import AdminRoutes from './AdminRoutes';
import CustomerRoutes from './CustomerRoutes';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/customer" replace />} />
      <Route path="/admin/*" element={<AdminRoutes />} />
      <Route path="/customer/*" element={<CustomerRoutes />} />
    </Routes>
  );
};

export default AppRoutes;