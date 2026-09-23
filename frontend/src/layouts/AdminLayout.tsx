import React from 'react';
import { Outlet } from 'react-router-dom';

export const AdminLayout: React.FC = () => {
  return (
    <div className="adminlayout-wrapper min-h-screen">
      <Outlet />
    </div>
  );
};

export default AdminLayout;
