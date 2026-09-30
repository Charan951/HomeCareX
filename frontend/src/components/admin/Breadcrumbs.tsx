import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { findAdminPage } from '@/config/adminNav';

/**
 * Group > Page (> detail segment).
 * A trailing id such as /admin/bookings/BK-1042 becomes an extra crumb, and the
 * page crumb turns into a link back to the list.
 */
export const Breadcrumbs: React.FC = () => {
  const { pathname } = useLocation();
  const page = findAdminPage(pathname);
  const detail = page && pathname !== page.path ? pathname.slice(page.path.length + 1).split('/')[0] : '';

  const sep = (key: string) => <ChevronRight key={key} className="breadcrumbs__separator" aria-hidden />;

  const crumbs: React.ReactNode[] = [];

  if (!page) {
    crumbs.push(
      <span key="nf" className="breadcrumbs__current">
        Page not found
      </span>,
    );
  } else {
    if (page.path !== '/admin') crumbs.push(<span key="group">{page.groupName}</span>);
    if (detail) {
      crumbs.push(
        <Link key="page" to={page.path} className="breadcrumbs__link">
          {page.label}
        </Link>,
        <span key="detail" className="breadcrumbs__current" aria-current="page">
          {decodeURIComponent(detail)}
        </span>,
      );
    } else {
      crumbs.push(
        <span key="page" className="breadcrumbs__current" aria-current="page">
          {page.label}
        </span>,
      );
    }
  }

  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      {crumbs.map((crumb, i) => (
        <React.Fragment key={i}>
          {i > 0 && sep(`sep-${i}`)}
          {crumb}
        </React.Fragment>
      ))}
    </nav>
  );
};

export default Breadcrumbs;