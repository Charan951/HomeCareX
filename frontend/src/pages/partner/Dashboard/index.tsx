import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
 
export const PartnerDashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
 
  return (
    <div className="partner-page-container p-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Partner Dashboard</h1>
        <button
          type="button"
          onClick={() => void logout().finally(() => navigate('/login', { replace: true }))}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium hover:bg-gray-50"
        >
          <LogOut size={16} /> Log out
        </button>
      </div>
      <p className="mt-2 text-gray-600">
        Welcome{user?.name ? `, ${user.name}` : ''}
        {user?.email ? ` (${user.email})` : ''}.
      </p>
    </div>
  );
};
 
export default PartnerDashboardPage;
