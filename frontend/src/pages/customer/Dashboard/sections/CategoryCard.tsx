import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { customerPath } from "@/routes/customerPath";
import { FOCUS_RING } from "@/components/customer/focusRing";
import type { DashboardCategoryDto } from "@/features/customer";
import CategoryIcon from "./CategoryIcon";

export default function CategoryCard({ category: c }: { category: DashboardCategoryDto }) {
  return (
    <Link
      to={customerPath("/services")}
      className={`dashboard-category group relative overflow-hidden rounded-[20px] border border-white bg-white p-3.5 shadow-[0_7px_22px_rgba(30,27,46,.06)] transition-all duration-300 ${FOCUS_RING}`}
    >
      <span aria-hidden="true" className="dashboard-category__glow" />
      <div className="relative z-[1] flex items-start justify-between gap-2">
        <div className="dashboard-category__icon flex h-11 w-11 items-center justify-center rounded-[14px] bg-gradient-to-br from-brand-soft to-white text-2xl shadow-[inset_0_0_0_1px_rgba(67,56,202,.06)] transition-transform duration-300">
          <CategoryIcon icon={c.icon} />
        </div>
        <span className="dashboard-category__arrow flex h-7 w-7 items-center justify-center rounded-full bg-canvas text-muted transition-all duration-300">
          <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
        </span>
      </div>
      <div className="relative z-[1] mt-3 text-[13px] font-bold leading-tight text-ink">{c.name}</div>
      <div className="relative z-[1] mt-1 text-[10px] font-medium text-muted">
        {c.serviceCount} {c.serviceCount === 1 ? "service" : "services"}
      </div>
    </Link>
  );
}
