import type { RefObject } from "react";
import { Link, useLocation } from "react-router-dom";
import { Bell, Menu } from "lucide-react";
import clsx from "clsx";
import OnlineIndicator from "../OnlineIndicator";
import PartnerProfileMenu from "./PartnerProfileMenu";
import { PARTNER_DRAWER_ID } from "./PartnerMobileDrawer";
import { PARTNER_SIDEBAR_ID } from "./PartnerSidebar";
import { getPartnerTitle, partnerPath } from "./partnerNav";
import { FOCUS_RING } from "@/components/customer/focusRing";

interface Props {
  menuOpen: boolean;
  onMenuClick: () => void;
  menuButtonRef: RefObject<HTMLButtonElement>;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  online: boolean;
  onOnlineChange: (v: boolean) => void;
  unread?: number;
}

const HAMBURGER = "-ml-2 flex h-11 w-11 items-center justify-center rounded text-ink hover:bg-canvas";

export default function PartnerTopBar({
  menuOpen, onMenuClick, menuButtonRef, sidebarOpen, onToggleSidebar, online, onOnlineChange, unread = 0,
}: Props) {
  const { pathname } = useLocation();
  return (
    <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-line bg-panel px-4 md:h-16 md:px-8">
      <div className="flex min-w-0 items-center gap-1">
        <button
          ref={menuButtonRef}
          type="button"
          onClick={onMenuClick}
          aria-label="Open menu"
          aria-expanded={menuOpen}
          aria-controls={PARTNER_DRAWER_ID}
          className={clsx(HAMBURGER, "md:hidden", FOCUS_RING)}
        >
          <Menu className="h-6 w-6" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          aria-expanded={sidebarOpen}
          aria-controls={PARTNER_SIDEBAR_ID}
          className={clsx(HAMBURGER, "hidden md:flex", FOCUS_RING)}
        >
          <Menu className="h-6 w-6" aria-hidden="true" />
        </button>
        <Link to={partnerPath()} className={clsx("rounded text-base font-semibold text-brand", !sidebarOpen ? "md:mr-3" : "md:hidden", FOCUS_RING)}>
          HomeCareX
        </Link>
        <p className="hidden truncate text-lg font-semibold text-ink md:ml-1 md:block">{getPartnerTitle(pathname)}</p>
      </div>

      <div className="flex items-center gap-1 md:gap-3">
        <OnlineIndicator online={online} onChange={onOnlineChange} />
        <Link
          to={partnerPath("/system/notifications")}
          aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
          className={clsx("relative flex h-11 w-11 items-center justify-center rounded-full text-ink transition-colors hover:bg-canvas", FOCUS_RING)}
        >
          <Bell className="h-5 w-5" aria-hidden="true" />
          {unread > 0 && (
            <span aria-hidden="true" className="absolute right-1 top-1 h-4 min-w-[16px] rounded-full bg-danger px-1 text-center text-[10px] font-medium leading-4 text-white">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Link>
        <PartnerProfileMenu />
      </div>
    </header>
  );
}