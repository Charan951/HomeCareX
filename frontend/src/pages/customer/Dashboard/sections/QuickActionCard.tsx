import { Link } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import clsx from "clsx";
import { FOCUS_RING } from "@/components/customer/focusRing";

interface QuickActionCardProps {
  label: string;
  to: string;
  icon: LucideIcon;
  disabled?: boolean;
}

export default function QuickActionCard({ label, to, icon: Icon, disabled = false }: QuickActionCardProps) {
  if (disabled) {
    return (
      <span
        aria-disabled="true"
        title={`${label} isn't available yet`}
        className="dashboard-action flex flex-col items-center gap-2 rounded-xl border border-line bg-panel px-3 py-3 text-center text-xs text-muted opacity-50"
      >
        <Icon className="h-5 w-5" aria-hidden="true" />
        {label}
      </span>
    );
  }
  return (
    <Link
      to={to}
      className={clsx(
        "dashboard-action flex flex-col items-center gap-2 rounded-xl border border-line bg-panel px-3 py-3 text-center text-xs font-medium text-ink hover:border-brand",
        FOCUS_RING,
      )}
    >
      <Icon className="h-5 w-5 text-brand" aria-hidden="true" />
      {label}
    </Link>
  );
}
