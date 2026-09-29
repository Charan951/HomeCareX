import { Bell } from "lucide-react";
import { Link } from "react-router-dom";
import clsx from "clsx";
import { customerPath } from "@/routes/customerPath";
import { FOCUS_RING } from "./focusRing";

interface NotificationBellProps {
  /** Unread count (mock for now, see hooks/useUnreadNotifications). */
  count?: number;
}

/** Bell entry point — a real link to /customer/notifications with an unread badge. */
export default function NotificationBell({ count = 0 }: NotificationBellProps) {
  return (
    <Link
      to={customerPath("/notifications")}
      aria-label={count > 0 ? `Notifications, ${count} unread` : "Notifications"}
      className={clsx(
        "relative flex h-11 w-11 items-center justify-center rounded-full text-ink transition-colors hover:bg-canvas",
        FOCUS_RING,
      )}
    >
      <Bell className="h-5 w-5" aria-hidden="true" />
      {count > 0 && (
        <span
          aria-hidden="true"
          className="absolute right-1 top-1 h-4 min-w-[16px] rounded-full bg-danger px-1 text-center text-[10px] font-medium leading-4 text-white"
        >
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Link>
  );
}
