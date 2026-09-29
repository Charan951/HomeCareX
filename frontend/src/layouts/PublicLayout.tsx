import React from "react";
import { Outlet } from "react-router-dom";

import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";

const PublicLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col">

      {/* Skip Link */}
      <a
        href="#main-content"
        className="
          sr-only
          focus:not-sr-only
          focus:fixed
          focus:top-4
          focus:left-4
          focus:z-[100]
          focus:rounded-lg
          focus:bg-[#4338ca]
          focus:px-4
          focus:py-2
          focus:text-white
          focus:outline-none
        "
      >
        Skip to main content
      </a>

      <Header />

      <main id="main-content" className="flex-1">
        <Outlet />
      </main>

      <Footer />

    </div>
  );
};

export default PublicLayout;