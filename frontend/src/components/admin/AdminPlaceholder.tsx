import React from 'react';
import { Construction } from 'lucide-react';
import { PageHeader } from './PageHeader';

interface AdminPlaceholderProps {
  title: string;
  description?: string;
  /** Who is building the real page, so nobody wonders why it's empty. */
  owner?: string;
}

/** Stand-in for pages another teammate is still building. Replace the route's element when the real page lands. */
export const AdminPlaceholder: React.FC<AdminPlaceholderProps> = ({ title, description, owner }) => (
  <div className="admin-page-container">
    <PageHeader title={title} description={description} />
    <div className="hcx-placeholder">
      <Construction size={28} aria-hidden />
      <h2>This page is coming soon</h2>
      <p>{owner ? `${owner} is building this screen.` : 'This screen is still being built.'}</p>
    </div>
  </div>
);

export default AdminPlaceholder;
