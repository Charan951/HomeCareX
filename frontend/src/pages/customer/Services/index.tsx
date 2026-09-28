import { SERVICES, CATEGORIES } from "../../../mocks/customerMockData";

export default function Services() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-ink">Services</h1>
        <p className="text-muted text-sm mt-1">Transparent pricing, duration, and ratings for every service.</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {SERVICES.map((s) => {
          const category = CATEGORIES.find((c) => c.id === s.categoryId);
          return (
            <div key={s.id} className="bg-panel border border-line rounded p-4 flex items-start gap-3">
              <div className="text-2xl">{category?.icon}</div>
              <div className="flex-1">
                <div className="font-medium text-ink">{s.name}</div>
                <div className="text-xs text-muted mt-0.5">{category?.name} · {s.duration}</div>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs text-muted">⭐ {s.rating} ({s.reviewCount.toLocaleString()})</span>
                  <span className="font-semibold text-ink">₹{s.price}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
