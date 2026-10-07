import clsx from "clsx";
import type { CatalogService } from "@/types/catalog";
import { ServiceCard } from "./ServiceCard";
import { ServiceCardSkeleton } from "./ServiceCardSkeleton";

const GRID = "grid gap-4 sm:grid-cols-2 xl:grid-cols-3";

interface Props {
  services: CatalogService[];
  /** The previous page is still showing while the next one loads. */
  busy?: boolean;
}

export function ServiceGrid({ services, busy = false }: Props) {
  return (
    <ul aria-busy={busy} className={clsx(GRID, "transition-opacity duration-150", busy && "opacity-60")}>
      {services.map((s, i) => (
        <li key={s.id}>
          <ServiceCard service={s} index={i} />
        </li>
      ))}
    </ul>
  );
}

/** First load: same grid shape as ServiceGrid so nothing jumps. */
export function ServiceGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">Loading services…</span>
      <ul className={GRID} aria-hidden="true">
        {Array.from({ length: count }, (_, i) => (
          <li key={i}>
            <ServiceCardSkeleton />
          </li>
        ))}
      </ul>
    </div>
  );
}
