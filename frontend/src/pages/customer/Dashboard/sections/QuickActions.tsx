import { Gift, Headset, Navigation, RotateCcw } from "lucide-react";
import { customerPath } from "@/routes/customerPath";
import QuickActionCard from "./QuickActionCard";

interface QuickActionsProps {
  hasActiveBooking: boolean;
  /** "Book again" needs a past booking to repeat. */
  hasBookingHistory: boolean;
}

/** Shortcut row: Book again, Track order, Refer & earn, Get support. */
export default function QuickActions({ hasActiveBooking, hasBookingHistory }: QuickActionsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <QuickActionCard label="Book again" to={customerPath("/services")} icon={RotateCcw} disabled={!hasBookingHistory} />
      <QuickActionCard label="Track order" to={customerPath("/tracking")} icon={Navigation} disabled={!hasActiveBooking} />
      <QuickActionCard label="Refer & earn" to={customerPath("/referrals")} icon={Gift} />
      <QuickActionCard label="Get support" to={customerPath("/support")} icon={Headset} />
    </div>
  );
}
