import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import clsx from "clsx";
import { customerPath } from "@/routes/customerPath";
import { FOCUS_RING } from "@/components/customer/focusRing";
import { Icon3D, tintAt } from "@/components/customer";
import type { DashboardCategoryDto } from "@/features/customer";
import { categoryPhoto } from "./dashboardImages";

/**
 * Category tile. Shows the category photo with the name over a dark fade; if there is no photo
 * (or it fails to load) it falls back to the tinted tile with a floating 3D icon.
 * `index` picks the tint and offsets the float.
 */
export default function CategoryCard({ category: c, index = 0 }: { category: DashboardCategoryDto; index?: number }) {
  const photo = categoryPhoto(c.slug);
  const [photoFailed, setPhotoFailed] = useState(false);
  const count = `${c.serviceCount} ${c.serviceCount === 1 ? "service" : "services"}`;

  if (photo && !photoFailed) {
    return (
      <Link
        to={customerPath("/services")}
        className={clsx(
          "dashboard-category group relative block h-[184px] overflow-hidden rounded-[20px] border border-white shadow-[0_7px_22px_rgba(30,27,46,.08)] md:h-[232px]",
          tintAt(index),
          FOCUS_RING,
        )}
      >
        <img
          src={photo.src}
          alt=""
          loading="lazy"
          decoding="async"
          draggable={false}
          onError={() => setPhotoFailed(true)}
          style={{ objectPosition: photo.position }}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none"
        />
        <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-[rgba(20,18,36,.82)] via-[rgba(20,18,36,.45)] via-[36%] to-transparent to-[64%]" />

        <span
          aria-hidden="true"
          className="absolute right-3 top-3 flex h-[30px] w-[30px] items-center justify-center rounded-full bg-white text-brand shadow-sm transition-colors duration-300 group-hover:bg-brand group-hover:text-white"
        >
          <ArrowRight className="h-3.5 w-3.5" />
        </span>

        <span className="absolute inset-x-3.5 bottom-3.5 flex flex-col gap-0.5">
          <span className="text-[13px] font-semibold leading-tight text-white md:text-sm">{c.name}</span>
          <span className="text-xs text-white/90">{count}</span>
        </span>
      </Link>
    );
  }

  return (
    <Link
      to={customerPath("/services")}
      className={clsx(
        "dashboard-category group relative flex min-h-[184px] flex-col justify-between overflow-hidden rounded-[20px] border border-white p-3.5 shadow-[0_7px_22px_rgba(30,27,46,.06)] md:min-h-[232px] md:p-4",
        tintAt(index),
        FOCUS_RING,
      )}
    >
      <div className="relative z-[1] max-w-[62%]">
        <div className="text-[13px] font-semibold leading-tight text-ink md:text-sm">{c.name}</div>
        <div className="mt-1 text-xs text-muted">{count}</div>
      </div>

      <span
        aria-hidden="true"
        className="relative z-[1] flex h-7 w-7 items-center justify-center rounded-full bg-white text-brand shadow-sm transition-all duration-300 group-hover:translate-x-1 group-hover:bg-brand group-hover:text-white"
      >
        <ArrowRight className="h-3.5 w-3.5" />
      </span>

      <Icon3D hints={[c.icon, c.name, c.slug]} size={76} delay={index * -0.7} className="absolute -bottom-1 right-1 md:right-2 md:h-[88px] md:w-[88px]" />
    </Link>
  );
}
