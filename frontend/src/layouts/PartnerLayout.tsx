import React from 'react';
import { Outlet } from 'react-router-dom';

export const PartnerLayout: React.FC = () => {
  return (
    <div className="partnerlayout-wrapper min-h-screen">
      <Outlet />
    </div>
  );
};

export default PartnerLayout;
