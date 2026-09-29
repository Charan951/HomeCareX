import React, { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";

import AuthLayout from "../layouts/AuthLayout";
import PublicLayout from "../layouts/PublicLayout";

import PageLoader from "../components/common/PageLoader";
import { ROUTES } from "../constants/routes";

/*
|--------------------------------------------------------------------------
| Lazy Loaded Public Pages
|--------------------------------------------------------------------------
*/

const Home = lazy(() => import("../pages/public/Home/Home"));

const Services = lazy(
  () => import("../pages/public/Services/Services")
);

const About = lazy(
  () => import("../pages/public/About/About")
);

const Contact = lazy(
  () => import("../pages/public/Contact/Contact")
);

/*
|--------------------------------------------------------------------------
| Lazy Loaded Authentication Pages
|--------------------------------------------------------------------------
*/

const Login = lazy(
  () => import("../pages/public/Login")
);

const Register = lazy(
  () => import("../pages/public/Register")
);

const ForgotPassword = lazy(
  () => import("../pages/public/ForgotPassword")
);

/*
|--------------------------------------------------------------------------
| Lazy Loaded System Pages
|--------------------------------------------------------------------------
*/

const Unauthorized = lazy(
  () => import("../pages/public/Unauthorized")
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

        {/* =========================================================
            Public Layout
        ========================================================== */}

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

          {/* About */}
          <Route
            path={ROUTES.ABOUT}
            element={<About />}
          />

          {/* Contact */}
          <Route
            path={ROUTES.CONTACT}
            element={<Contact />}
          />

          {/* Unauthorized */}
          <Route
            path={ROUTES.UNAUTHORIZED}
            element={<Unauthorized />}
          />

          {/* 404 - Any unknown URL */}
          <Route
            path="*"
            element={<NotFound />}
          />

        </Route>


        {/* =========================================================
            Authentication Layout
        ========================================================== */}

        <Route element={<AuthLayout />}>

          {/* Login */}
          <Route
            path={ROUTES.LOGIN}
            element={<Login />}
          />

          {/* Register */}
          <Route
            path={ROUTES.REGISTER}
            element={<Register />}
          />

          {/* Forgot Password */}
          <Route
            path={ROUTES.FORGOT_PASSWORD}
            element={<ForgotPassword />}
          />

        </Route>

      </Routes>

    </Suspense>
  );
};

export default PublicRoutes;