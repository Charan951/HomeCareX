import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { findAdminPage } from '@/config/adminNav';

/**
 * Home > Group > Page (> detail segment).
 * A trailing id such as /admin/bookings/BK-1042 becomes an extra crumb, and the
 * page crumb turns into a link back to the list.
 */
export const Breadcrumbs: React.FC = () => {
  const { pathname } = useLocation();
  const page = findAdminPage(pathname);
  const detail = page && pathname !== page.path ? pathname.slice(page.path.length + 1).split('/')[0] : '';

  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      <Link to="/admin" className="breadcrumbs__home" aria-label="Admin home">
        <Home size={16} />
      </Link>

      {page ? (
        <>
          {page.path !== '/admin' && (
            <>
              <ChevronRight className="breadcrumbs__separator" aria-hidden />
              <span>{page.groupName}</span>
            </>
          )}
          <ChevronRight className="breadcrumbs__separator" aria-hidden />
          {detail ? (
            <>
              <Link to={page.path} className="breadcrumbs__link">
                {page.label}
              </Link>
              <ChevronRight className="breadcrumbs__separator" aria-hidden />
              <span className="breadcrumbs__current" aria-current="page">
                {decodeURIComponent(detail)}
              </span>
            </>
          ) : (
            <span className="breadcrumbs__current" aria-current="page">
              {page.label}
            </span>
          )}
        </>
      ) : (
        <>
          <ChevronRight className="breadcrumbs__separator" aria-hidden />
          <span className="breadcrumbs__current">Page not found</span>
        </>
      )}
    </nav>
  );
};

export default Breadcrumbs;
