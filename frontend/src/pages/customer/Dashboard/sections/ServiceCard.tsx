import { useState } from "react";
import { Link } from "react-router-dom";
import { Clock, Star } from "lucide-react";
import clsx from "clsx";
import { customerPath } from "@/routes/customerPath";
import { FOCUS_RING } from "@/components/customer/focusRing";
import { Icon3D, tintAt } from "@/components/customer";
import { formatDuration, type DashboardServiceDto } from "@/features/customer";
import { servicePhoto } from "./dashboardImages";

/**
 * Links straight into the booking flow: /customer/book/:serviceSlug.
 * The top of the card is the service photo; with no photo (or a failed load) it is a tinted tile with a 3D icon.
 */
export default function ServiceCard({ service: s, index = 0 }: { service: DashboardServiceDto; index?: number }) {
  const photo = servicePhoto(s.slug);
  const [photoFailed, setPhotoFailed] = useState(false);


  return (
    <Link
      to={customerPath(`/book/${s.slug}`)}
      className={clsx(
        "dashboard-service group relative w-[188px] shrink-0 overflow-hidden rounded-[20px] border border-white bg-white p-2.5 shadow-[0_9px_26px_rgba(30,27,46,.07)] md:w-auto",
        FOCUS_RING,
      )}
    >
      {photo && !photoFailed ? (
        <div className={clsx("relative h-[110px] overflow-hidden rounded-[14px] md:h-[124px]", tintAt(index + 1))}>
          <img
            src={photo.src}
            alt=""
            loading="lazy"
            decoding="async"
            draggable={false}
            onError={() => setPhotoFailed(true)}
            style={{ objectPosition: photo.position }}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none"
          />
        </div>
      ) : (
        <div className={clsx("relative flex h-[110px] items-center justify-center overflow-hidden rounded-[14px] md:h-[124px]", tintAt(index + 1))}>
          <span aria-hidden="true" className="dashboard-service__ring" />
          <Icon3D hints={[s.icon, s.name, s.slug]} size={64} delay={index * -0.9} />
        </div>
      )}
      <div className="mt-2.5 truncate text-[13px] font-semibold text-ink">{s.name}</div>
      <div className="mt-1 flex items-center gap-1.5 text-xs text-muted">
        <span className="flex items-center gap-0.5 text-ink">
          <Star className="h-3 w-3 fill-accent text-accent" aria-hidden="true" />
          {s.ratingCount > 0 ? s.rating.toFixed(1) : "New"}
          {s.ratingCount > 0 && <span className="sr-only"> rating</span>}
        </span>
        <span aria-hidden="true">·</span>
        <span className="flex items-center gap-0.5">
          <Clock className="h-3 w-3" aria-hidden="true" />
          {formatDuration(s.durationMinutes)}
        </span>
      </div>
      <div className="mt-2.5 flex items-center justify-between">
        <span className="text-sm font-bold text-ink">₹{s.price}</span>
        <span className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-ink transition-transform duration-300 group-hover:scale-105">Book</span>
      </div>
    </Link>
  );
}
