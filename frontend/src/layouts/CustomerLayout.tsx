import React from 'react';
import { Outlet } from 'react-router-dom';

export const CustomerLayout: React.FC = () => {
  return (
    <div className="customerlayout-wrapper min-h-screen">
      <Outlet />
    </div>
  );
};

export default CustomerLayout;
