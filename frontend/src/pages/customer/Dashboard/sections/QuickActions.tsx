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
    <div className="grid grid-cols-4 gap-1 rounded-[22px] border border-line bg-panel px-2 py-3.5 shadow-[0_6px_18px_-12px_rgba(30,27,46,.25)] sm:px-6">
      <QuickActionCard label="Book again" to={customerPath("/services")} icon={RotateCcw} tone="indigo" disabled={!hasBookingHistory} />
      <QuickActionCard label="Track order" to={customerPath("/tracking")} icon={Navigation} tone="orange" disabled={!hasActiveBooking} />
      <QuickActionCard label="Refer & earn" to={customerPath("/referrals")} icon={Gift} tone="pink" />
      <QuickActionCard label="Get support" to={customerPath("/support")} icon={Headset} tone="green" />
    </div>
  );
}
