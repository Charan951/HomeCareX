import type { DashboardServiceDto } from "@/features/customer";
import ServiceCard from "./ServiceCard";

/** Horizontally-scrolling "recommended for you" row. */
export default function RecommendedServices({ services }: { services: DashboardServiceDto[] }) {
  return (
<div className="relative -mx-4 flex gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
        {services.map((s) => (
        <ServiceCard key={s.id} service={s} />
      ))}
    </div>
  );
}
