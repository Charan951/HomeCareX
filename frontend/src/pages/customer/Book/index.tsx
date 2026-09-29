import { Link, useParams } from "react-router-dom";
import { customerPath } from "@/routes/customerPath";
import { FOCUS_RING } from "@/components/customer/focusRing";
import { CATEGORIES, SERVICES } from "@/mocks/customerMockData";

/**
 * TEMPORARY placeholder for /customer/book/:serviceSlug.
 *
 * The real multi-step booking flow (BookingStepper, StepService, StepAddress,
 * StepSlot, StepReview, draftStore) is a separate in-progress module. This
 * file exists only so the "Book now" buttons on Services/Dashboard have a
 * working destination instead of a 404 in the meantime — replace this file's
 * contents with the real stepper; keep the route registration in
 * CustomerRoutes.tsx (path="/book/:serviceSlug") as-is, since Services and
 * Dashboard already link to it using this slug format.
 */
export default function Book() {
  const { serviceSlug } = useParams<{ serviceSlug: string }>();
  const service = SERVICES.find((s) => s.slug === serviceSlug);
  const category = service ? CATEGORIES.find((c) => c.id === service.categoryId) : undefined;

  if (!service) {
    return (
      <div className="space-y-4">
        <p className="text-muted text-sm">We couldn't find that service.</p>
        <Link to={customerPath("/services")} className={`text-sm font-medium text-brand ${FOCUS_RING}`}>
          ← Back to services
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link to={customerPath("/services")} className={`text-sm font-medium text-brand ${FOCUS_RING}`}>
        ← Back to services
      </Link>

      <div className="bg-panel border border-line rounded p-6 flex items-start gap-3">
        <div className="text-2xl">{category?.icon}</div>
        <div>
          <h1 className="text-xl font-semibold text-ink">{service.name}</h1>
          <p className="text-sm text-muted mt-0.5">{category?.name} · {service.duration} · ₹{service.price}</p>
        </div>
      </div>

      <div className="bg-panel border border-dashed border-line rounded p-6 text-center">
        <p className="font-medium text-ink">Booking flow coming soon</p>
        <p className="text-sm text-muted mt-1">
          The step-by-step booking experience for this service is being built.
        </p>
      </div>
    </div>
  );
}
