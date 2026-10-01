import React from "react";
import { Outlet } from "react-router-dom";

import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import SkipLink from "../components/common/SkipLink";
import ScrollToTop from "../components/common/ScrollToTop";
import ErrorBoundary from "../components/common/ErrorBoundary";
import { useOnlineStatus } from "../hooks/useOnlineStatus";

const PublicLayout: React.FC = () => {
  const online = useOnlineStatus();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Accessibility Skip Link */}
      <SkipLink />

      {/* Scroll to top and page focus */}
      <ScrollToTop />

      {/* Header */}
      <Header />

      {/* Offline banner notification when connection drops */}
      {!online && (
        <div
          role="status"
          aria-live="polite"
          className="flex items-center justify-center gap-2 border-b border-[#ff8a3d]/25 bg-[#fff3ea] px-4 py-2.5 text-sm font-medium text-[#1b1b3a]"
        >
          <span
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#ff8a3d] text-xs font-bold text-white"
            aria-hidden="true"
          >
            !
          </span>
          <span>
            <strong>You&apos;re offline.</strong> Please check your internet connection.
          </span>
        </div>
      )}

      {/* Page Content wrapped in Error Boundary */}
      <main
        id="main-content"
        className="flex-1"
        tabIndex={-1}
      >
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default PublicLayout;