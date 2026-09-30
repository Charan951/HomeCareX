import React, { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";

import PublicLayout from "../layouts/PublicLayout";

import PageLoader from "../components/common/PageLoader";
import { ROUTES } from "../constants/routes";

/*
|--------------------------------------------------------------------------
| Lazy Loaded Public Pages
|--------------------------------------------------------------------------
| Auth screens (/login, /register, /forgot-password) and /unauthorized are
| registered in AppRoutes, which matches them before this catch-all tree.
*/

const Home = lazy(() => import("../pages/public/Home/Home"));

const Services = lazy(
  () => import("../pages/public/Services/Services")
);

const About = lazy(
  () => import("../pages/public/About/About")
);

const Contact = lazy(
  () => import("../pages/public/Contact")
);

const NotFound = lazy(
  () => import("../pages/public/NotFound")
);

/*
|--------------------------------------------------------------------------
| Public Routes
|--------------------------------------------------------------------------
*/

const PublicRoutes: React.FC = () => {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path={ROUTES.HOME} element={<Home />} />
          <Route path={ROUTES.SERVICES} element={<Services />} />
          <Route path={ROUTES.ABOUT} element={<About />} />
          <Route path={ROUTES.CONTACT} element={<Contact />} />

          {/* 404 - Any unknown URL */}
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Suspense>
  );
};

export default PublicRoutes;
