import type { DashboardServiceDto } from "@/features/customer";
import ServiceCard from "./ServiceCard";

/** Scrolling row on phones; a responsive grid from md up. */
export default function RecommendedServices({ services }: { services: DashboardServiceDto[] }) {
  return (
    <div className="relative -mx-4 flex gap-3 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-3 md:gap-4 md:overflow-visible md:px-0 md:pb-0 xl:grid-cols-5">
      {services.map((s, i) => (
        <ServiceCard key={s.id} service={s} index={i} />
      ))}
    </div>
  );
}
