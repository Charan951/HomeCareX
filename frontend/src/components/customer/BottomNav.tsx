import { Link, useLocation } from "react-router-dom";
import clsx from "clsx";
import { BOTTOM_NAV_ITEMS, type CustomerNavItem } from "./customerNav";
import { FOCUS_RING } from "./focusRing";

const norm = (path: string) => (path.length > 1 ? path.replace(/\/+$/, "") : path).toLowerCase();
const isUnder = (pathname: string, prefix: string) => pathname === norm(prefix) || pathname.startsWith(`${norm(prefix)}/`);

function isItemActive(pathname: string, { to, end, alsoActiveFor }: CustomerNavItem) {
  const path = norm(pathname);
  const own = end ? path === norm(to) : isUnder(path, to);
  return own || !!alsoActiveFor?.some((p) => isUnder(path, p));
}

/**
 * Mobile bottom navigation (below md): Categories / Services / Home / My Bookings / Profile.
 * Everything else (Account, Support, Referrals…) lives on the Profile tab.
 *
 * Design
 *  - Floating, rounded, frosted-glass bar inset from the screen edges, with a soft shadow.
 *  - The ACTIVE tab is the raised button (brand gradient, white ring) — whichever tab that is.
 *    Every other tab, Home included, is a quiet icon + label tab. Raised and plain tabs take
 *    the same height, so the bar doesn't jump when you switch.
 *  - Plain tabs: icon + label (tinted on hover). The active tab also has a bold brand label and
 *    aria-current="page" (never colour alone). Services also stays active in the booking flow.
 *
 * Behaviour
 *  - Safe area: bottom gap is max(0.75rem, env(safe-area-inset-bottom)).
 *  - Touch targets: every tab is at least 60px tall and a fifth of the bar wide.
 *  - Press feedback uses motion-safe: so it is skipped for prefers-reduced-motion.
 *  - The wrapper ignores pointer events so taps in the side gutters reach the page.
 */
export default function BottomNav() {
  const { pathname } = useLocation();

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-20 border-t border-line/70 bg-panel pb-[env(safe-area-inset-bottom)] shadow-[0_-6px_18px_-8px_rgba(30,27,46,0.18)] md:hidden"
    >
      <ul className="mx-auto grid max-w-md grid-cols-5">
        {BOTTOM_NAV_ITEMS.map((item) => {
          const { label, to, icon: Icon } = item;
          const active = isItemActive(pathname, item);

          return (
            <li key={to} className="min-w-0">
              <Link
                to={to}
                aria-current={active ? "page" : undefined}
                className={clsx(
                  "group relative flex min-h-[60px] flex-col items-center justify-center gap-0.5 rounded-none py-1.5 transition-colors",
                  FOCUS_RING,
                  active ? "text-brand" : "text-muted hover:text-ink",
                )}
              >
                {active ? (
                  <span
                    aria-hidden="true"
                    className="flex h-7 w-12 items-center justify-center rounded-full bg-brand text-white transition-all duration-200 motion-safe:group-active:scale-95"
                  >
                    <Icon className="h-[18px] w-[18px]" strokeWidth={2.2} />
                  </span>
                ) : (
                  <span
                    aria-hidden="true"
                    className="flex h-7 w-11 items-center justify-center rounded-full transition-all duration-200 group-hover:bg-canvas motion-safe:group-active:scale-90"
                  >
                    <Icon className="h-5 w-5" strokeWidth={1.9} />
                  </span>
                )}
                <span
                  className={clsx(
                    "block w-full whitespace-nowrap px-0.5 text-center text-[10px] leading-tight tracking-tight",
                    active ? "font-semibold" : "font-medium",
                  )}
                >
                  {label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
