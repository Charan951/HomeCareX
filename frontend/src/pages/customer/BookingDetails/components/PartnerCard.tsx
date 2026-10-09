import { BadgeCheck, MapPin, Phone, Star, UserRound } from "lucide-react";
import clsx from "clsx";
import { FOCUS_RING } from "@/components/customer/focusRing";
import type { BookingDetailPartner } from "@/types/bookingDetail";
import { formatRating } from "../../Bookings/bookingModel";

/** Who is coming. Before a partner accepts, says so instead of leaving an empty box. */
export default function PartnerCard({
  partner,
  hasPartner,
}: {
  partner: BookingDetailPartner | null;
  hasPartner: boolean;
}) {
  if (!hasPartner) {
    return (
      <p className="text-sm text-muted">
        We're finding the best partner for you. You'll see their details here as
        soon as someone accepts.
      </p>
    );
  }

  const rating = formatRating(partner?.rating);
  const name = partner?.name?.trim() || "Your partner";

  return (
    <div className="flex flex-wrap items-center gap-4">
      <span
        aria-hidden="true"
        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand"
      >
        {partner?.name ? (
          <span className="text-xl font-bold">
            {partner.name.trim().charAt(0).toUpperCase()}
          </span>
        ) : (
          <UserRound className="h-6 w-6" />
        )}
      </span>
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <p className="break-words text-sm font-semibold text-ink">{name}</p>
          {partner?.verified && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-brand">
              <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
              Verified partner
            </span>
          )}
        </div>
        {rating && (
          <p className="flex items-center gap-1 text-xs text-muted">
            <Star
              className="h-3.5 w-3.5 fill-amber-400 text-amber-400"
              aria-hidden="true"
            />
            <span>
              {rating}
              <span className="sr-only"> out of 5</span>
              {partner?.ratingCount
                ? ` (${partner.ratingCount} jobs rated)`
                : ""}
            </span>
          </p>
        )}
        {(partner?.phone || partner?.city) && (
          <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
            {partner?.phone && (
              <span className="inline-flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5" aria-hidden="true" />
                {partner.phone}
              </span>
            )}
            {partner?.city && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                {partner.city}
              </span>
            )}
          </p>
        )}
      </div>
      {partner?.phone && (
        <a
          href={`tel:${partner.phone}`}
          aria-label={`Call ${name}`}
          className={clsx(
            "inline-flex h-10 items-center gap-2 rounded-xl border border-brand/30 px-4 text-sm font-semibold text-brand transition hover:bg-brand-soft",
            FOCUS_RING,
          )}
        >
          <Phone className="h-4 w-4" aria-hidden="true" />
          Call
        </a>
      )}
    </div>
  );
}
