import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { allAdminPages } from '@/config/adminNav';

export const Breadcrumbs: React.FC = () => {
  const { pathname } = useLocation();
  const currentPage = allAdminPages.find((page) => page.path === pathname);

  return (
    <nav className="breadcrumbs">
      <Link to="/admin" className="breadcrumbs__home">
        <Home size={16} />
      </Link>

      {currentPage ? (
        <>
          <ChevronRight className="breadcrumbs__separator" />
          <span>{currentPage.groupName}</span>
          <ChevronRight className="breadcrumbs__separator" />
          <span className="breadcrumbs__current">{currentPage.label}</span>
        </>
      ) : (
        <>
          <ChevronRight className="breadcrumbs__separator" />
          <span className="breadcrumbs__current">Page not found</span>
        </>
      )}
    </nav>
  );
};

export default Breadcrumbs;