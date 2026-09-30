import { Link } from "react-router-dom";
import { customerPath } from "@/routes/customerPath";
import { FOCUS_RING } from "@/components/customer/focusRing";

interface BookLinkProps {
  slug: string;
  serviceName: string;
  className?: string;
}

/** "Book now" entry point into the booking wizard. `?step=1` starts at Step 1 even if an older
 *  draft for the same service is sitting in storage (its values stay pre-filled). */
export default function BookLink({ slug, serviceName, className = "" }: BookLinkProps) {
  return (
    <Link
      to={`${customerPath(`/book/${slug}`)}?step=1`}
      aria-label={`Book ${serviceName}`}
      className={`inline-flex min-h-[44px] items-center justify-center rounded bg-brand px-4 text-sm font-medium text-white hover:opacity-90 ${FOCUS_RING} ${className}`}
    >
      Book now
    </Link>
  );
}
