import { Suspense } from "react";
import { Outlet, useLocation } from "react-router-dom";
import clsx from "clsx";
import {
  BottomNav,
  LoadingState,
  OfflineBanner,
  RouteErrorBoundary,
  Sidebar,
  TopBar,
} from "@/components/customer";
import { useHiddenPageScrollbar } from "@/hooks/useHiddenPageScrollbar";
import { useSidebarOpen } from "@/hooks/useSidebarOpen";
import { customerPath } from "@/routes/customerPath";

/**
 * CustomerLayout — the shell every /customer/* page renders inside.
 *  - md+   : Sidebar (left, grouped; the TopBar hamburger collapses it) + TopBar + content
 *  - mobile: TopBar (address picker + bell) + content + BottomNav
 *            (Categories / Services / Home / My Bookings / Profile), hidden on the Profile page
 *            itself. No hamburger: the rest of the menu (Account, Support, Referrals, Log out…)
 *            lives on the Profile page.
 * The content area always shows something: a spinner while a page chunk loads,
 * an error card if a page crashes, and an offline banner when the network drops.
 * `min-w-0` on the column stops wide content from causing horizontal scroll.
 */
export default function CustomerLayout() {
  const { pathname } = useLocation();
  const [sidebarOpen, toggleSidebar] = useSidebarOpen();
  useHiddenPageScrollbar();
  // The Profile page is the mobile menu itself, so it shows no bottom nav (its sub-pages still do).
  const hideBottomNav = pathname.replace(/\/+$/, "").toLowerCase() === customerPath("/profile");

  return (
    <div className="flex min-h-screen overflow-x-clip bg-canvas">
      <a
        href="#customer-main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-brand focus:px-3 focus:py-2 focus:text-white"
      >
        Skip to content
      </a>

      <Sidebar open={sidebarOpen} onClose={toggleSidebar} />

      <div className="flex min-w-0 flex-1 flex-col">
        <div className={hideBottomNav ? "hidden md:block" : undefined}>
          <TopBar sidebarOpen={sidebarOpen} onToggleSidebar={toggleSidebar} />
        </div>
        <OfflineBanner />

        <main
          id="customer-main"
          tabIndex={-1}
          className={clsx(
            "flex-1 px-4 py-6 outline-none md:px-8 md:pb-6",
            // Leave room for the fixed bottom nav (it shows on every page, Profile included).
            "pb-[calc(5rem+env(safe-area-inset-bottom))]",
          )}
        >
          <RouteErrorBoundary resetKey={pathname}>
            <Suspense fallback={<LoadingState />}>
              <Outlet />
            </Suspense>
          </RouteErrorBoundary>
        </main>
      </div>

      { <BottomNav />}
    </div>
  );
}
