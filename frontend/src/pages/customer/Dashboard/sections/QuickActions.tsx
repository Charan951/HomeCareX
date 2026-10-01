import { Link } from "react-router-dom";
import { Gift, Headset, Navigation, RotateCcw } from "lucide-react";
import clsx from "clsx";
import { customerPath } from "@/routes/customerPath";
import { FOCUS_RING } from "@/components/customer/focusRing";

interface QuickActionsProps {
  hasActiveBooking: boolean;
  hasCompletedBooking: boolean;
}

/** Shortcut row: Book again, Track order, Refer & earn, Get support. */
export default function QuickActions({ hasActiveBooking, hasCompletedBooking }: QuickActionsProps) {
  const actions = [
    { label: "Book again", to: customerPath("/services"), icon: RotateCcw, disabled: !hasCompletedBooking },
    { label: "Track order", to: customerPath("/tracking"), icon: Navigation, disabled: !hasActiveBooking },
    { label: "Refer & earn", to: customerPath("/referrals"), icon: Gift, disabled: false },
    { label: "Get support", to: customerPath("/support"), icon: Headset, disabled: false },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {actions.map(({ label, to, icon: Icon, disabled }) =>
        disabled ? (
          <span
            key={label}
            aria-disabled="true"
            title={`${label} isn't available yet`}
            className="flex flex-col items-center gap-2 rounded border border-line bg-panel px-3 py-3 text-center text-xs text-muted opacity-50"
          >
            <Icon className="h-5 w-5" aria-hidden="true" />
            {label}
          </span>
        ) : (
          <Link
            key={label}
            to={to}
            className={clsx(
              "flex flex-col items-center gap-2 rounded border border-line bg-panel px-3 py-3 text-center text-xs font-medium text-ink hover:border-brand",
              FOCUS_RING,
            )}
          >
            <Icon className="h-5 w-5 text-brand" aria-hidden="true" />
            {label}
          </Link>
        ),
      )}
    </div>
  );
}
