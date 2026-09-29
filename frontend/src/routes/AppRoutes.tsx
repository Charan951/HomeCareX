import React from 'react';
import { Route, Routes } from 'react-router-dom';

import PublicRoutes from './PublicRoutes';
import AdminRoutes from './AdminRoutes';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/*" element={<PublicRoutes />} />
      <Route path="/admin/*" element={<AdminRoutes />} />
    </Routes>
  );
};

export default AppRoutes;