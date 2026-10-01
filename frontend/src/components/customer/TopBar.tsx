import type { RefObject } from "react";
import { Link } from "react-router-dom";
import { Menu } from "lucide-react";
import clsx from "clsx";
import { useUnreadNotifications } from "@/hooks/useUnreadNotifications";
import { customerPath } from "@/routes/customerPath";
import LocationPicker from "./LocationPicker";
import NotificationBell from "./NotificationBell";
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

const HAMBURGER = "-ml-2 flex h-11 w-11 items-center justify-center rounded-lg text-ink hover:bg-canvas";

/**
 * Top bar.
 *  - mobile: ☰ (opens the slide-in menu) + brand … bell
 *  - md+   : ☰ (collapses the sidebar) | delivery-location picker (Zomato-style) … bell
 * The account avatar/menu now lives at the bottom of the sidebar (SidebarAccount) and in the mobile drawer.
 */
export default function TopBar({ menuOpen, onMenuClick, menuButtonRef, sidebarOpen, onToggleSidebar }: TopBarProps) {
  const unread = useUnreadNotifications();

  return (
    <header className="customer-topbar sticky top-0 z-30 flex h-[62px] items-center justify-between gap-2 border-b border-white/80 bg-white/90 px-3 shadow-[0_6px_22px_rgba(30,27,46,.06)] backdrop-blur-xl md:h-16 md:px-8">
      <div className="flex min-w-0 flex-1 items-center gap-1">
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

        <Link to={customerPath()} className={clsx("rounded text-base font-semibold text-brand", !sidebarOpen ? "md:mr-1" : "md:hidden", "hidden md:inline-flex", FOCUS_RING)}>
          HomeCareX
        </Link>

        <span aria-hidden="true" className="mx-3 hidden h-8 w-px bg-line md:block" />
        {/* One picker at every width (a single instance keeps DOM ids unique). */}
        <div className="min-w-0 flex-1 md:flex-none">
          <LocationPicker />
        </div>
      </div>

      <div className="shrink-0 rounded-full bg-canvas/80 p-0.5"><NotificationBell count={unread} /></div>
    </header>
  );
}
