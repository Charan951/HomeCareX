import type { DashboardBookingDto } from "@/features/customer";
import UpcomingBookingCard from "./UpcomingBookingCard";

/** Scheduled bookings that haven't started yet — distinct from live bookings and full history. */
export default function UpcomingBookings({ bookings }: { bookings: DashboardBookingDto[] }) {
  return (
    <ul className="divide-y divide-line">
      {bookings.map((b) => (
        <li key={b.id}>
          <UpcomingBookingCard booking={b} />
        </li>
      ))}
    </ul>
  );
}
