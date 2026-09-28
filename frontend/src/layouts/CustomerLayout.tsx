import { Suspense } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { BottomNav, LoadingState, OfflineBanner, RouteErrorBoundary, Sidebar, TopBar } from "@/components/customer";

/**
 * CustomerLayout — the shell every /customer/* page renders inside.
 *  - md+   : Sidebar (left, grouped) + TopBar + content
 *  - mobile: TopBar + content + BottomNav (Home / Bookings / Support / Profile)
 * The content area always shows something: a spinner while a page chunk loads,
 * an error card if a page crashes, and an offline banner when the network drops.
 * `min-w-0` on the column stops wide content from causing horizontal scroll.
 */
export default function CustomerLayout() {
  const { pathname } = useLocation();

  return (
    <div className="flex min-h-screen bg-canvas">
      <a
        href="#customer-main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-brand focus:px-3 focus:py-2 focus:text-white"
      >
        Skip to content
      </a>

      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <OfflineBanner />

        <main
          id="customer-main"
          tabIndex={-1}
          className="flex-1 px-4 py-6 pb-[calc(5rem+env(safe-area-inset-bottom))] outline-none md:px-8 md:pb-6"
        >
          <RouteErrorBoundary resetKey={pathname}>
            <Suspense fallback={<LoadingState />}>
              <Outlet />
            </Suspense>
          </RouteErrorBoundary>
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
