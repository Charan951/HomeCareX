import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Banknote, CalendarCheck, HardHat, Users } from 'lucide-react';
import { adminApi, type AdminStats } from '@/services/adminApi';

// Bookings and revenue are still sample numbers. Customers and Partners are live from the API.
export const AdminDashboardPage: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    adminApi.getStats().then(setStats).catch(() => setError(true));
  }, []);

  const live = (n?: number) => (error ? '—' : n === undefined ? '…' : n.toLocaleString('en-IN'));

  const kpis = [
    { label: 'Total Bookings', value: '1,284', change: '+8.2% this month', icon: CalendarCheck, to: '/admin/bookings' },
    { label: 'Total Customers', value: live(stats?.customers), change: 'Registered customers', icon: Users, to: '/admin/customers' },
    { label: 'Total Partners', value: live(stats?.partners), change: 'Registered partners', icon: HardHat, to: '/admin/manage-partners' },
    { label: 'Revenue', value: '₹18,42,500', change: '+11.4% this month', icon: Banknote, to: '/admin/payments' },
  ];

  return (
    <div className="admin-page-container p-6">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>

      <div className="kpi-grid">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Link key={kpi.label} to={kpi.to} className="kpi-card kpi-card--link" aria-label={`${kpi.label}: open page`}>
              <div className="kpi-card__icon">
                <Icon size={20} />
              </div>
              <div className="kpi-card__body">
                <p className="kpi-card__label">{kpi.label}</p>
                <p className="kpi-card__value">{kpi.value}</p>
                <p className="kpi-card__change">{kpi.change}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default AdminDashboardPage;