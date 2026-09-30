import React from "react";
import { Outlet } from "react-router-dom";

import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import SkipLink from "../components/common/SkipLink";
import ScrollToTop from "../components/common/ScrollToTop";

const PublicLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col">

      {/* Accessibility Skip Link */}
      <SkipLink />

      {/* Scroll to top and page focus */}
      <ScrollToTop />

      {/* Header */}
      <Header />

      {/* Page Content */}
      <main
        id="main-content"
        className="flex-1"
        tabIndex={-1}
      >
        <Outlet />
      </main>

      {/* Footer */}
      <Footer />

    </div>
  );
};

export default PublicLayout;