import { Link } from "react-router-dom";
import { customerPath } from "@/routes/customerPath";
import { ErrorState } from "@/components/customer";

/** Catch-all for unknown /customer/* URLs, so they never render a blank page. */
export default function NotFound() {
  return (
    <div className="space-y-4">
      <ErrorState title="Page not found" message="The page you're looking for doesn't exist or has moved." />
      <p className="text-center">
        <Link to={customerPath()} className="text-sm font-medium text-brand underline">
          Back to dashboard
        </Link>
      </p>
    </div>
  );
}
