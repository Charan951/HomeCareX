import { Link } from "react-router-dom";
import clsx from "clsx";
import { customerPath } from "@/routes/customerPath";
import { FOCUS_RING } from "./focusRing";
import { Bell3D } from "./TopBarIcons";

interface NotificationBellProps {
  /** Unread count (mock for now, see hooks/useUnreadNotifications). */
  count?: number;
}

/** Bell entry point —a a real link to /customer/notifications with an unread badge. */
export default function NotificationBell({ count = 0 }: NotificationBellProps) {
  return (
    <Link
      to={customerPath("/notifications")}
      aria-label={count > 0 ? `Notifications, ${count} unread` : "Notifications"}
      className={clsx(
        "group relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-line bg-white text-ink transition-colors hover:border-brand/30 hover:bg-brand-soft/40",
        FOCUS_RING,
      )}
    >
      <Bell3D className="h-[26px] w-[26px] origin-top transition-transform duration-200 motion-safe:group-hover:-rotate-12" />
      {count > 0 && (
        <span
          aria-hidden="true"
          className="absolute -right-0.5 -top-0.5 h-[18px] min-w-[18px] rounded-full bg-danger px-1 text-center text-[10px] font-semibold leading-[18px] text-white ring-2 ring-white"
        >
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Link>
  );
}
