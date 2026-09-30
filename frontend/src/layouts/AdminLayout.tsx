import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '@/components/admin/Sidebar';
import { Header } from '@/components/admin/Header';
import { Breadcrumbs } from '@/components/admin/Breadcrumbs';
import '@/styles/admin.css';

export const AdminLayout: React.FC = () => (
  <div className="admin-layout">
    <a href="#admin-main" className="sr-only">Skip to content</a>
    <Sidebar />
    <div className="admin-layout__content">
      <Header />
      <div className="breadcrumb-bar">
        <Breadcrumbs />
      </div>
      <main id="admin-main" className="admin-layout__main">
        <Outlet />
      </main>
    </div>
  </div>
);

export default AdminLayout;
