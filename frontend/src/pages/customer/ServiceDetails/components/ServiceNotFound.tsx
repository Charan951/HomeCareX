import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, SearchX } from "lucide-react";
import clsx from "clsx";
import { FOCUS_RING } from "@/components/customer/focusRing";
import { customerPath } from "@/routes/customerPath";

/** Shown for an unknown or inactive slug (the API answers 404). */
export default function ServiceNotFound() {
  const navigate = useNavigate();
  return (
    <div role="alert" className="mx-auto flex max-w-lg flex-col items-center rounded-[32px] border border-line bg-panel px-6 py-14 text-center">
      <span className="relative flex h-24 w-24 items-center justify-center rounded-full bg-brand-soft text-brand">
        <SearchX className="h-10 w-10 motion-safe:animate-floaty" aria-hidden="true" />
      </span>
      <h1 className="mt-6 text-2xl font-bold tracking-tight text-ink">This service isn&apos;t available</h1>
      <p className="mt-2 max-w-sm text-sm leading-6 text-muted">It may have been removed, or the link is out of date. Browse our services to find what you need.</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link to={customerPath("/services")} className={clsx("inline-flex min-h-[48px] items-center rounded-full bg-brand px-6 text-sm font-bold text-white hover:bg-[#3730A3]", FOCUS_RING)}>
          Browse services
        </Link>
        <button type="button" onClick={() => navigate(-1)} className={clsx("inline-flex min-h-[48px] items-center gap-2 rounded-full border border-line px-5 text-sm font-semibold text-ink hover:border-brand hover:text-brand", FOCUS_RING)}>
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Go back
        </button>
      </div>
    </div>
  );
}
