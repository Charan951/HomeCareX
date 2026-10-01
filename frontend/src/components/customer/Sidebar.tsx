import { Link } from "react-router-dom";
import clsx from "clsx";
import { customerPath } from "@/routes/customerPath";
import SidebarAccount from "./SidebarAccount";
import SidebarNav from "./SidebarNav";
import { FOCUS_RING } from "./focusRing";
import { NO_SCROLLBAR } from "./noScrollbar";

export const CUSTOMER_SIDEBAR_ID = "customer-sidebar";

interface SidebarProps {
  /** Desktop only: false collapses the sidebar to zero width (toggled by the TopBar hamburger). */
  open?: boolean;
}

/**
 * Desktop sidebar (md and up). On mobile the MobileDrawer + BottomNav take over.
 * When collapsed it is `invisible`, so its links are skipped by Tab and screen readers.
 * The inner panel keeps a fixed width so the links don't reflow while the width animates.
 */
export default function Sidebar({ open = true }: SidebarProps) {
  return (
    <aside
      id={CUSTOMER_SIDEBAR_ID}
      aria-label="Customer navigation"
      className={clsx(
        "sticky top-0 hidden h-screen shrink-0 overflow-x-hidden overflow-y-auto border-r border-line bg-panel transition-[width,visibility] duration-200 ease-out md:block",
        NO_SCROLLBAR,
        open ? "visible w-60" : "invisible w-0 border-r-0",
      )}
    >
      <div className="flex min-h-full w-60 flex-col">
        <div className="px-5 pb-4 pt-5">
          <Link to={customerPath()} className={clsx("rounded text-lg font-semibold tracking-tight text-brand", FOCUS_RING)}>
            HomeCareX
          </Link>
          <p className="mt-0.5 text-xs text-muted">Customer Dashboard</p>
        </div>
        <SidebarNav idPrefix="sidebar" />
        <SidebarAccount />
      </div>
    </aside>
  );
}
