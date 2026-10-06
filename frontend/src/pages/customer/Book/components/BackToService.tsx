import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import clsx from "clsx";
import { FOCUS_RING } from "@/components/customer/focusRing";
import { customerPath } from "@/routes/customerPath";

/** Single way out of the booking flow: back to the service the customer was looking at. */
export default function BackToService({ slug }: { slug: string }) {
  return (
    <Link
      to={customerPath(`/services/${slug}`)}
      className={clsx("inline-flex min-h-[40px] items-center gap-2 rounded-full text-sm font-semibold text-muted transition-colors hover:text-brand", FOCUS_RING)}
    >
      <ArrowLeft className="h-4 w-4" aria-hidden="true" />
      Back to service details
    </Link>
  );
}
