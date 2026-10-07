import React, { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";

import PublicLayout from "../layouts/PublicLayout";
import PageLoader from "../components/common/PageLoader";
import { ROUTES } from "../constants/routes";

const Home = lazy(
  () => import("../pages/public/Home/Home")
);

const Services = lazy(
  () => import("../pages/public/Services/index")
);

const ServiceDetails = lazy(
  () => import("../pages/public/ServiceDetails")
);

const About = lazy(
  () => import("../pages/public/About/About")
);

const FAQ = lazy(
  () => import("../pages/public/FAQ")
);

const Contact = lazy(
  () => import("../pages/public/Contact/Contact")
);

const Terms = lazy(
  () => import("../pages/public/Terms")
);

const Privacy = lazy(
  () => import("../pages/public/Privacy")
);

const NotFound = lazy(
  () => import("../pages/public/NotFound")
);

const PublicRoutes: React.FC = () => {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>

        <Route element={<PublicLayout />}>

          {/* Home */}
          <Route
            path={ROUTES.HOME}
            element={<Home />}
          />

          {/* Services */}
          <Route
            path={ROUTES.SERVICES}
            element={<Services />}
          />

          {/* Service Details */}
          <Route
            path="/services/:id"
            element={<ServiceDetails />}
          />

          {/* About */}
          <Route
            path={ROUTES.ABOUT}
            element={<About />}
          />

          {/* FAQ */}
          <Route
            path={ROUTES.FAQ}
            element={<FAQ />}
          />

          {/* Contact */}
          <Route
            path={ROUTES.CONTACT}
            element={<Contact />}
          />

          {/* Terms */}
          <Route
            path={ROUTES.TERMS}
            element={<Terms />}
          />

          {/* Privacy */}
          <Route
            path={ROUTES.PRIVACY}
            element={<Privacy />}
          />

          {/* 404 */}
          <Route
            path="*"
            element={<NotFound />}
          />

        </Route>

      </Routes>
    </Suspense>
  );
};

export default PublicRoutes;