import { Link } from "react-router-dom";
import { CATEGORIES } from "../../../mocks/customerMockData";
import { customerPath } from "@/routes/customerPath";

export default function Categories() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-ink">Categories</h1>
        <p className="text-muted text-sm mt-1">Browse all service categories available on HomeCareX.</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {CATEGORIES.map((c) => (
          <Link key={c.id} to={customerPath("/services")} className="bg-panel border border-line rounded p-5 hover:border-brand transition-colors">
            <div className="text-3xl mb-3">{c.icon}</div>
            <div className="font-medium text-ink">{c.name}</div>
            <p className="text-xs text-muted mt-1">{c.description}</p>
            <div className="text-xs text-brand font-medium mt-3">{c.serviceCount} services →</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
