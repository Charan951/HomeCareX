import { Link } from "react-router-dom";
import { Clock, Star, ArrowUpRight } from "lucide-react";
import { customerPath } from "@/routes/customerPath";
import { FOCUS_RING } from "@/components/customer/focusRing";
import { formatDuration, type DashboardServiceDto } from "@/features/customer";
import CategoryIcon from "./CategoryIcon";

export default function ServiceCard({ service: s }: { service: DashboardServiceDto }) {
  return (
    <Link
      to={customerPath(`/book/${s.slug}`)}
      className={`dashboard-service group relative w-[188px] shrink-0 overflow-hidden rounded-[20px] border border-white bg-white p-2.5 shadow-[0_9px_26px_rgba(30,27,46,.07)] transition-all duration-300 ${FOCUS_RING}`}
    >
      <div className="dashboard-service__visual relative flex h-[88px] items-center justify-center overflow-hidden rounded-[16px] bg-gradient-to-br from-brand-soft via-white to-accent-soft text-3xl">
        <span aria-hidden="true" className="dashboard-service__ring" />
        <CategoryIcon icon={s.icon} />
        <span className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/85 text-brand shadow-sm backdrop-blur transition-transform duration-300 group-hover:rotate-12">
          <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
        </span>
      </div>
      <div className="mt-2.5 truncate text-[12px] font-bold text-ink">{s.name}</div>
      <div className="mt-1 flex items-center gap-1.5 text-[10px] font-medium text-muted">
        <span className="flex items-center gap-0.5 text-ink">
          <Star className="h-3 w-3 fill-accent text-accent" aria-hidden="true" />
          {s.ratingCount > 0 ? s.rating.toFixed(1) : "New"}
        </span>
        <span aria-hidden="true">·</span>
        <span className="flex items-center gap-0.5">
          <Clock className="h-3 w-3" aria-hidden="true" />
          {formatDuration(s.durationMinutes)}
        </span>
      </div>
      <div className="mt-2.5 flex items-center justify-between">
        <span className="text-[13px] font-extrabold text-ink">₹{s.price}</span>
        <span className="rounded-full bg-brand px-2.5 py-1 text-[9px] font-bold text-white shadow-sm transition-transform duration-300 group-hover:scale-105">Book</span>
      </div>
    </Link>
  );
}
