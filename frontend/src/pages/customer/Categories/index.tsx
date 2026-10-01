import { Link } from "react-router-dom";
import { CATEGORIES, SERVICES } from "../../../mocks/customerMockData";
import { customerPath } from "@/routes/customerPath";
import { FOCUS_RING } from "@/components/customer/focusRing";
import BookLink from "@/components/customer/BookLink";

export default function Categories() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-ink">Categories</h1>
        <p className="text-muted text-sm mt-1">Browse all service categories available on HomeCareX.</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {CATEGORIES.map((c) => {
          const services = SERVICES.filter((s) => s.categoryId === c.id);
          return (
            <section key={c.id} aria-labelledby={`cat-${c.id}`} className="flex flex-col bg-panel border border-line rounded p-5">
              <div className="text-3xl mb-3" aria-hidden="true">{c.icon}</div>
              <h2 id={`cat-${c.id}`} className="font-medium text-ink">{c.name}</h2>
              <p className="text-xs text-muted mt-1">{c.description}</p>

              {services.length > 0 && (
                <ul className="mt-4 space-y-3 border-t border-line pt-3">
                  {services.map((s) => (
                    <li key={s.id} className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-ink">{s.name}</p>
                        <p className="text-xs text-muted">₹{s.price} · {s.duration}</p>
                      </div>
                      <BookLink slug={s.slug} serviceName={s.name} className="shrink-0" />
                    </li>
                  ))}
                </ul>
              )}

              <Link
                to={`${customerPath("/services")}?category=${c.id}`}
                className={`mt-4 inline-flex min-h-[44px] items-center text-xs font-medium text-brand hover:underline ${FOCUS_RING}`}
              >
                {c.serviceCount} services →
              </Link>
            </section>
          );
        })}
      </div>
    </div>
  );
}
