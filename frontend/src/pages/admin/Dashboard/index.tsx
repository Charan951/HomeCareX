import React from 'react';
import { Banknote, CalendarCheck, HardHat, Users } from 'lucide-react';

// Simple KPI card data. In a real app this would come from an API call.
const kpis = [
  {
    label: 'Total Bookings',
    value: '1,284',
    change: '+8.2% this month',
    icon: CalendarCheck,
  },
  {
    label: 'Total Customers',
    value: '3,972',
    change: '+4.6% this month',
    icon: Users,
  },
  {
    label: 'Active Partners',
    value: '256',
    change: '+2.1% this month',
    icon: HardHat,
  },
  {
    label: 'Revenue',
    value: '₹18,42,500',
    change: '+11.4% this month',
    icon: Banknote,
  },
];

export const AdminDashboardPage: React.FC = () => {
  return (
    <div className="admin-page-container p-6">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>

      <div className="kpi-grid">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="kpi-card">
              <div className="kpi-card__icon">
                <Icon size={20} />
              </div>
              <div className="kpi-card__body">
                <p className="kpi-card__label">{kpi.label}</p>
                <p className="kpi-card__value">{kpi.value}</p>
                <p className="kpi-card__change">{kpi.change}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminDashboardPage;
