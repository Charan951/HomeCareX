import { Link } from "react-router-dom";
import clsx from "clsx";
import PartnerSidebarNav from "./PartnerSidebarNav";
import { partnerPath } from "./partnerNav";
import { FOCUS_RING } from "@/components/customer/focusRing";
import { NO_SCROLLBAR } from "@/components/customer/noScrollbar";

export const PARTNER_SIDEBAR_ID = "partner-sidebar";

/** Desktop sidebar (md+). Collapses to zero width via the top-bar hamburger. */
export default function PartnerSidebar({ open = true }: { open?: boolean }) {
  return (
    <aside
      id={PARTNER_SIDEBAR_ID}
      aria-label="Partner navigation"
      className={clsx(
        "sticky top-0 hidden h-screen shrink-0 overflow-x-hidden overflow-y-auto border-r border-line bg-panel transition-[width,visibility] duration-200 ease-out md:block",
        NO_SCROLLBAR,
        open ? "visible w-60" : "invisible w-0 border-r-0",
      )}
    >
      <div className="w-60">
        <div className="px-5 py-5">
          <Link to={partnerPath()} className={clsx("rounded text-lg font-semibold tracking-tight text-brand", FOCUS_RING)}>
            HomeCareX
          </Link>
          <p className="text-[11px] font-medium uppercase tracking-wider text-muted">Partner</p>
        </div>
        <PartnerSidebarNav idPrefix="psidebar" />
      </div>
    </aside>
  );
}