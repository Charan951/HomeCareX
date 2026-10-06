import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import clsx from "clsx";
import { customerPath } from "@/routes/customerPath";
import { categoryVisual } from "@/pages/customer/Shared/visuals";
import type { CatalogCategory } from "@/types/catalog";
import Icon3D from "../Icon3D";
import { FOCUS_RING } from "../focusRing";
import { plural } from "./format";

interface Props {
  category: CatalogCategory;
  /** Index in the grid; staggers the icon float animation. */
  index: number;
  /** The large lead tile (first category on wide screens). */
  featured?: boolean;
}

/**
 * Photo-first category tile. With a photo: image + dark gradient + a 3D icon badge.
 * Without one (or if it fails to load): a tinted tile with a large 3D icon.
 * Opens the Services page already filtered to this category.
 */
export function CategoryCard({ category: c, index, featured = false }: Props) {
  const v = categoryVisual(c.slug);
  const [photoFailed, setPhotoFailed] = useState(false);
  const photo = v.image && !photoFailed ? v.image : null;
  const hints = [c.icon, c.name, c.slug];

  return (
    <Link
      to={`${customerPath("/services")}?category=${encodeURIComponent(c.slug)}`}
      aria-label={`${c.name}, ${plural(c.serviceCount, "service")}`}
      className={clsx(
        "group relative flex h-full w-full flex-col justify-end overflow-hidden rounded-[22px]   transition-shadow duration-200 md:rounded-[26px] md:p-5",
        "hover:shadow-[0_18px_30px_-16px_rgba(67,56,202,.55)]",
        photo ? "bg-ink text-white" : clsx("text-ink", v.tint),
        FOCUS_RING,
      )}
    >
      {photo ? (
        <>
          <img
            src={photo}
            alt=""
            loading={index < 4 ? "eager" : "lazy"}
            decoding="async"
            onError={() => setPhotoFailed(true)}
            style={{ objectPosition: v.focus }}
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-b from-transparent from-35% to-[#0F0C28]/80" />
          <span
            aria-hidden="true"
            className={clsx(
              "absolute left-3 top-3 flex items-center justify-center rounded-2xl bg-white/90 shadow-[0_6px_14px_-6px_rgba(0,0,0,.4)] md:left-4 md:top-4",
              featured ? "h-14 w-14 md:h-16 md:w-16" : "h-10 w-10 md:h-12 md:w-12",
            )}
          >
            <Icon3D hints={hints} size={featured ? 44 : 30} float={false} />
          </span>
        </>
      ) : (
        <Icon3D
          hints={hints}
          size={featured ? 150 : 96}
          delay={index * 0.65}
          className="absolute right-2 top-3 drop-shadow-[0_10px_10px_rgba(30,27,46,.2)] md:right-4 md:top-4"
        />
      )}

      <div className="relative max-w-[78%]">
        <h2 className={clsx("line-clamp-2 font-semibold leading-snug", featured ? "text-xl md:text-[28px]" : "text-sm md:text-[17px]")}>{c.name}</h2>
        <p className={clsx("mt-0.5 text-[11px] md:text-[13px]", photo ? "text-white/85" : "text-ink/60")}>{plural(c.serviceCount, "service")}</p>
      </div>

      <span
        aria-hidden="true"
        className="absolute bottom-3.5 right-3.5 hidden h-8 w-8 items-center justify-center rounded-full bg-white text-brand shadow-sm transition-all duration-200 md:bottom-5 md:right-5 md:flex md:translate-x-1 md:opacity-0 md:group-hover:translate-x-0 md:group-hover:opacity-100 md:group-focus-visible:translate-x-0 md:group-focus-visible:opacity-100"
      >
        <ArrowRight className="h-4 w-4" />
      </span>
    </Link>
  );
}
