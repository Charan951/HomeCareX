import React from "react";
import { Routes, Route } from "react-router-dom";

import PublicLayout from "../layouts/PublicLayout";

import Home from "../pages/public/Home/Home";
import Services from "../pages/public/Services/Services";
import About from "../pages/public/About/About";
import Contact from "../pages/public/Contact/Contact";

const PublicRoutes: React.FC = () => {
  return (
    <Routes>

      <Route element={<PublicLayout />}>

        <Route path="/" element={<Home />} />

        <Route path="/services" element={<Services />} />

        <Route path="/about" element={<About />} />

        <Route path="/contact" element={<Contact />} />

      </Route>

    </Routes>
  );
};

export default PublicRoutes;