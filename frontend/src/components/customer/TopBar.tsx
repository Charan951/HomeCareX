import { Link, useLocation } from "react-router-dom";
import clsx from "clsx";
import { customerPath } from "@/routes/customerPath";
import { getPageTitle } from "@/utils/pageTitle";
import NotificationBell from "./NotificationBell";
import ProfileMenu from "./ProfileMenu";
import { useUnreadNotifications } from "@/hooks";
import { FOCUS_RING } from "./focusRing";

/**
 * One responsive top bar:
 *  - mobile: brand link on the left (BottomNav handles navigation)
 *  - md+:    current page title on the left (Sidebar handles navigation)
 * Bell + profile menu are on the right at every width.
 */
export default function TopBar() {
  const { pathname } = useLocation();
  const unread = useUnreadNotifications();

  return (
    <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-line bg-panel px-4 md:h-16 md:px-8">
      <Link to={customerPath()} className={clsx("rounded text-base font-semibold text-brand md:hidden", FOCUS_RING)}>
        HomeCareX
      </Link>
      <p className="hidden truncate text-lg font-semibold text-ink md:block">{getPageTitle(pathname)}</p>

      <div className="flex items-center gap-1 md:gap-3">
        <NotificationBell count={unread} />
        <ProfileMenu />
      </div>
    </header>
  );
}
