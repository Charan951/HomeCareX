import React from 'react';
import { Routes, Route } from 'react-router-dom';
import PublicLayout from '../layouts/PublicLayout';

const PublicRoutes: React.FC = () => {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
       <Route path="/" element={null} />
      </Route>
    </Routes>
  );
};

export default PublicRoutes;