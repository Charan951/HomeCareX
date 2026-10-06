import { Link } from "react-router-dom";
import { X } from "lucide-react";
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
  /** Desktop only: collapses the sidebar (the X button in its header). */
  onClose?: () => void;
}

/**
 * Desktop sidebar (md and up). On mobile the BottomNav + Profile page take over.
 * When collapsed it is `invisible`, so its links are skipped by Tab and screen readers.
 * The inner panel keeps a fixed width so the links don't reflow while the width animates.
 */
export default function Sidebar({ open = true, onClose }: SidebarProps) {
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
        <div className="flex items-start justify-between gap-2 px-5 pb-4 pt-5">
          <div>
            <Link to={customerPath()} aria-label="HomeCareX home" className={clsx("inline-flex rounded-lg text-lg font-bold tracking-tight", FOCUS_RING)}>
              <span className="text-accent">Home</span>
              <span className="text-brand">CareX</span>
            </Link>
            <p className="mt-0.5 text-xs text-muted">Customer</p>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close sidebar"
              aria-expanded={open}
              aria-controls={CUSTOMER_SIDEBAR_ID}
              className={clsx(
                "-mr-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-line bg-gradient-to-b from-white to-brand-soft text-brand shadow-[inset_0_1px_0_#fff,0_4px_10px_-6px_rgba(67,56,202,.45)] transition-[transform,box-shadow] duration-200 hover:shadow-[inset_0_1px_0_#fff,0_8px_14px_-8px_rgba(67,56,202,.55)] active:scale-95",
                FOCUS_RING,
              )}
            >
              <X className="h-[18px] w-[18px]" strokeWidth={2.5} aria-hidden="true" />
            </button>
          )}
        </div>
        <SidebarNav idPrefix="sidebar" />
        <SidebarAccount />
      </div>
    </aside>
  );
}
