import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from '@/components/admin/Sidebar';
import { Header } from '@/components/admin/Header';
import { AdminSearch } from '@/components/admin/AdminSearch';
import '@/styles/admin.css';

export const AdminLayout: React.FC = () => {
  // Customers has its own search bar under the page title, so the global one is hidden there.
  const { pathname } = useLocation();
  const hideGlobalSearch = pathname === '/admin/customers' || pathname.startsWith('/admin/customers/');
  // Manage Partners: search sits on the left of the row under the navbar.
  const searchLeft = pathname === '/admin/manage-partners';
  return (
  <div className="admin-layout">
    <a href="#admin-main" className="sr-only">Skip to content</a>
    <Sidebar />
    <div className="admin-layout__content">
      <Header />
      {!hideGlobalSearch && (
        <div className={`breadcrumb-bar${searchLeft ? ' breadcrumb-bar--left' : ''}`}>
          <AdminSearch />
        </div>
      )}
      <main id="admin-main" className="admin-layout__main">
        <Outlet />
      </main>
    </div>
  </div>
  );
};

export default AdminLayout;