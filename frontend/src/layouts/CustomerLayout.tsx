
import { Outlet } from "react-router-dom";
import Sidebar from "../components/layout/Sidebar";
import TopBar from "../components/layout/TopBar";
import MobileHeader from "../components/layout/MobileHeader";
import BottomTabBar from "../components/layout/BottomTabBar";

interface CustomerLayoutProps {
  userName?: string;
  notificationCount?: number;
  onLogout?: () => void;
}

/**
 * CustomerLayout — the shared shell every customer route renders inside.
 *  - Desktop (md and up): Sidebar (left) + TopBar (top), main content scrolls
 *    to the right of the sidebar.
 *  - Mobile (below md): Sidebar/TopBar are hidden; MobileHeader carries the
 *    same notification bell + profile menu slots, and BottomTabBar replaces
 *    the sidebar for navigation. Bottom padding on <main> keeps content from
 *    being hidden behind the fixed tab bar.
 * Routes are rendered via <Outlet/> — see App.tsx for how routes nest under
 * this layout.
 */
export default function CustomerLayout({ userName, notificationCount, onLogout }: CustomerLayoutProps) {
  return (
    <div className="flex min-h-screen bg-canvas">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <TopBar userName={userName} notificationCount={notificationCount} onLogout={onLogout} />
        <MobileHeader userName={userName} notificationCount={notificationCount} onLogout={onLogout} />

        <main className="flex-1 px-4 md:px-8 py-6 pb-20 md:pb-6">
          <Outlet />
        </main>
      </div>

      <BottomTabBar />
    </div>
  );
}

