import React from 'react';
import { Routes, Route } from 'react-router-dom';
import PartnerDashboardPage from '@/pages/partner/Dashboard';
import PartnerAvailabilityPage from '../pages/partner/Availability';
import PartnerWorkingHoursPage from '@/pages/partner/WorkingHours';

export const PartnerRoutes: React.FC = () => (
  <Routes>
    <Route index element={<PartnerDashboardPage />} />
    <Route path="availability" element={<PartnerAvailabilityPage />} />
    <Route path="working-hours" element={<PartnerWorkingHoursPage/>} />
  </Routes>
);

export default PartnerRoutes;