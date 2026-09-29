import React from 'react';
import { Routes, Route } from 'react-router-dom';
import PartnerAvailabilityPage from '../pages/partner/Availability';
import PartnerWorkingHoursPage from '@/pages/partner/WorkingHours';

export const PartnerRoutes: React.FC = () => (
  <Routes>
    <Route path="availability" element={<PartnerAvailabilityPage />} />
    <Route path="working-hours" element={<PartnerWorkingHoursPage/>} />
  </Routes>
);

export default PartnerRoutes;