import type { RefObject } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu } from "lucide-react";
import clsx from "clsx";
import { useUnreadNotifications } from "@/hooks/useUnreadNotifications";
import { customerPath } from "@/routes/customerPath";
import { getPageTitle } from "@/utils/pageTitle";
import NotificationBell from "./NotificationBell";
import ProfileMenu from "./ProfileMenu";
import { MOBILE_DRAWER_ID } from "./MobileDrawer";
import { CUSTOMER_SIDEBAR_ID } from "./Sidebar";
import { FOCUS_RING } from "./focusRing";

interface TopBarProps {
  /** Mobile: is the slide-in menu open? */
  menuOpen: boolean;
  onMenuClick: () => void;
  menuButtonRef: RefObject<HTMLButtonElement>;
  /** Desktop: is the sidebar expanded? */
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

const HAMBURGER = "-ml-2 flex h-11 w-11 items-center justify-center rounded text-ink hover:bg-canvas";

/**
 * One responsive top bar with a hamburger at every width:
 *  - mobile: ☰ opens the slide-in menu, next to the brand link
 *  - md+   : ☰ collapses / expands the sidebar, then the page title
 *            (the brand link appears here while the sidebar is collapsed)
 * Bell is on the right at every width; the profile menu (avatar) is desktop-only — on mobile, Log out lives in the drawer.
 */
export default function TopBar({ menuOpen, onMenuClick, menuButtonRef, sidebarOpen, onToggleSidebar }: TopBarProps) {
  const { pathname } = useLocation();
  const unread = useUnreadNotifications();

  return (
    <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-line bg-panel px-4 md:h-16 md:px-8">
      <div className="flex min-w-0 items-center gap-1">
        {/* mobile hamburger -> slide-in drawer */}
        <button
          ref={menuButtonRef}
          type="button"
          onClick={onMenuClick}
          aria-label="Open menu"
          aria-expanded={menuOpen}
          aria-controls={MOBILE_DRAWER_ID}
          className={clsx(HAMBURGER, "md:hidden", FOCUS_RING)}
        >
          <Menu className="h-6 w-6" aria-hidden="true" />
        </button>

        {/* desktop hamburger -> collapse / expand sidebar */}
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          aria-expanded={sidebarOpen}
          aria-controls={CUSTOMER_SIDEBAR_ID}
          className={clsx(HAMBURGER, "hidden md:flex", FOCUS_RING)}
        >
          <Menu className="h-6 w-6" aria-hidden="true" />
        </button>

        <Link
          to={customerPath()}
          className={clsx("rounded text-base font-semibold text-brand", !sidebarOpen ? "md:mr-3" : "md:hidden", FOCUS_RING)}
        >
          HomeCareX
        </Link>

        <p className="hidden truncate text-lg font-semibold text-ink md:ml-1 md:block">{getPageTitle(pathname)}</p>
      </div>

      <div className="flex items-center gap-1 md:gap-3">
        <NotificationBell count={unread} />
        <div className="hidden md:block">
          <ProfileMenu />
        </div>
      </div>
    </header>
  );
}
