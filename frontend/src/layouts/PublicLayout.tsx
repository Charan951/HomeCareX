import React from 'react';
import { Outlet } from 'react-router-dom';

export const PublicLayout: React.FC = () => {
  return (
    <div className="publiclayout-wrapper min-h-screen">
      <Outlet />
    </div>
  );
};

export default PublicLayout;
