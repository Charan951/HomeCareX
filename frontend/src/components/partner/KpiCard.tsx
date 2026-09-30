import type { LucideIcon } from "lucide-react";

interface Props {
  label: string;
  value: string | number;
  icon: LucideIcon;
  hint?: string;
}

export default function KpiCard({ label, value, icon: Icon, hint }: Props) {
  return (
    <div className="rounded border border-line bg-panel p-4">
      <div className="flex items-center justify-between text-muted">
        <span className="text-xs">{label}</span>
        <Icon size={18} className="text-brand" aria-hidden />
      </div>
      <p className="mt-2 text-2xl font-semibold text-ink">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}