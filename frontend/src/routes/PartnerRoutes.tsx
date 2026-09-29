import React from 'react';
import { Routes, Route } from 'react-router-dom';
import PartnerAvailabilityPage from '../pages/partner/Availability';
import PartnerWorkingHoursPage from '@/pages/partner/WorkingHours';
import PartnerBlackoutDatesPage from '@/pages/partner/BlackoutDates';
import PartnerSchedulePage from '@/pages/partner/Schedule';

export const PartnerRoutes: React.FC = () => (
  <Routes>
    <Route path="availability" element={<PartnerAvailabilityPage />} />
    <Route path="working-hours" element={<PartnerWorkingHoursPage />} />
    <Route path="schedule" element={<PartnerSchedulePage />} />
    <Route path="blackout-dates" element={<PartnerBlackoutDatesPage />} />
  </Routes>
);

export default PartnerRoutes;