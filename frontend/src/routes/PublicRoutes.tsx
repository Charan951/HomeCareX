import React from 'react';
import { Route, Routes } from 'react-router-dom';

import PublicLayout from '../layouts/PublicLayout';
import Home from '../pages/public/Home/Home';
import Services from '../pages/public/Services/Services';
import About from '../pages/public/About/About';
import ContactPage from '../pages/public/Contact';

const PublicRoutes: React.FC = () => {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/services" element={<Services />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<ContactPage />} />
      </Route>
    </Routes>
  );
};

export default PublicRoutes;