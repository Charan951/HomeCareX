import { NavLink } from "react-router-dom";
import clsx from "clsx";
import { BOTTOM_NAV_ITEMS } from "./customerNav";
import { FOCUS_RING } from "./focusRing";

/**
 * Mobile bottom navigation (below md): Home / Bookings / Support / Profile.
 *  - Safe-area: bottom padding uses env(safe-area-inset-bottom) (needs
 *    viewport-fit=cover in index.html) so it clears the iPhone home indicator.
 *  - Touch targets: every tab is at least 44px wide and 56px tall.
 *  - Active tab: coloured + bold + a top indicator bar (not colour alone).
 */
export default function BottomNav() {
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-panel pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <ul className="flex">
        {BOTTOM_NAV_ITEMS.map(({ label, to, icon: Icon, end }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                clsx(
                  "relative flex min-h-[56px] min-w-[44px] flex-col items-center justify-center gap-0.5 text-[11px] transition-colors",
                  FOCUS_RING,
                  isActive ? "font-semibold text-brand" : "text-muted",
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && <span aria-hidden="true" className="absolute inset-x-6 top-0 h-0.5 rounded-full bg-brand" />}
                  <Icon className="h-5 w-5" aria-hidden="true" />
                  <span>{label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
