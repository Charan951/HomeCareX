import { Link } from "react-router-dom";
import type { ActiveJob } from "@/types/partner";

const STATUS: Record<ActiveJob["status"], { label: string; chip: string }> = {
  en_route: { label: "On the way", chip: "bg-indigo-50 text-[#4338ca]" },
  arrived: { label: "Arrived", chip: "bg-amber-50 text-amber-700" },
  in_progress: { label: "In progress", chip: "bg-emerald-50 text-emerald-700" },
};

/** The job the partner is working on right now. Text-only card: status chip, service, customer, address, one action. */
export default function ActiveJobCard({ job }: { job: ActiveJob | null }) {
  if (!job) {
    return (
      <div className="rounded-xl border border-dashed border-line bg-panel p-6 text-center">
        <p className="text-sm font-medium text-ink">No active job</p>
        <p className="mt-1 text-xs text-muted">When you start a job, it shows up here.</p>
      </div>
    );
  }
  const time = new Date(job.scheduledAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  const { label, chip } = STATUS[job.status];

  return (
    <section aria-label="Active job" className="rounded-xl border border-line border-l-4 border-l-brand bg-panel p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${chip}`}>{label}</span>
        <span className="text-xs font-medium text-muted">{time}</span>
      </div>

      <h3 className="mt-3 truncate text-base font-semibold text-ink">{job.service}</h3>

      <dl className="mt-2 space-y-1 text-sm">
        <div className="flex gap-2">
          <dt className="w-16 shrink-0 text-muted">Customer</dt>
          <dd className="min-w-0 truncate text-ink">{job.customer}</dd>
        </div>
        {job.address && (
          <div className="flex gap-2">
            <dt className="w-16 shrink-0 text-muted">Address</dt>
            <dd className="min-w-0 text-ink">{job.address}</dd>
          </div>
        )}
      </dl>

      <Link
        to={`/partner/work/${job.id}`}
        className="mt-4 flex w-full items-center justify-center rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
      >
        Open job
      </Link>
    </section>
  );
}