import { NavLink } from "react-router-dom";
import clsx from "clsx";
import { customerPath } from "@/routes/customerPath";
import { Link } from "react-router-dom";
import { SIDEBAR_GROUPS } from "./customerNav";
import { FOCUS_RING } from "./focusRing";

/** Desktop sidebar (md and up). Hidden on mobile, where BottomNav takes over. */
export default function Sidebar() {
  return (
    <aside
      aria-label="Customer navigation"
      className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col overflow-y-auto border-r border-line bg-panel md:flex"
    >
      <div className="px-5 py-5">
        <Link
          to={customerPath()}
          className={clsx("rounded text-lg font-semibold tracking-tight text-brand", FOCUS_RING)}
        >
          HomeCareX
        </Link>
      </div>

      <nav aria-label="Main" className="flex-1 space-y-5 px-3 pb-6">
        {SIDEBAR_GROUPS.map((group) => {
          const headingId = `sidebar-${group.heading.toLowerCase()}`;
          return (
            <div key={group.heading}>
              <p id={headingId} className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted">
                {group.heading}
              </p>
              <ul aria-labelledby={headingId} className="space-y-0.5">
                {group.items.map(({ label, to, icon: Icon, end }) => (
                  <li key={to}>
                    <NavLink
                      to={to}
                      end={end}
                      className={({ isActive }) =>
                        clsx(
                          "flex items-center gap-3 rounded px-3 py-2.5 text-sm transition-colors",
                          FOCUS_RING,
                          isActive
                            ? "bg-brand-soft font-medium text-brand"
                            : "text-muted hover:bg-canvas hover:text-ink",
                        )
                      }
                    >
                      <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                      {label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
