import clsx from "clsx";
import { PILL_CLASS, pillFor, type BookingListItem } from "../bookingModel";

/** The coloured status pill. Live statuses get a dot so they read as "happening now". */
export function BookingStatusBadge({
  booking,
  now,
}: {
  booking: BookingListItem;
  now: number;
}) {
  const pill = pillFor(booking, now);
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium",
        PILL_CLASS[pill.tone],
      )}
    >
      {pill.dot && (
        <span
          aria-hidden="true"
          className="h-1.5 w-1.5 rounded-full bg-current"
        />
      )}
      {pill.label}
    </span>
  );
}
