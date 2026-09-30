import { Link } from "react-router-dom";
import { MapPin } from "lucide-react";
import type { ActiveJob } from "@/services/partnerApi";

const STATUS_LABEL: Record<ActiveJob["status"], string> = {
  en_route: "En route",
  arrived: "Arrived",
  in_progress: "In progress",
};

export default function ActiveJobCard({ job }: { job: ActiveJob | null }) {
  if (!job) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center">
        <p className="font-medium text-slate-700">No active job</p>
        <p className="mt-1 text-sm text-slate-500">When you start a job, it shows up here.</p>
      </div>
    );
  }
  const time = new Date(job.scheduledAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  return (
    <div className="rounded-xl border-2 border-[#ff8a3d] bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-slate-900">{job.service}</h3>
          <p className="text-sm text-slate-600">
            {job.customer} · {time}
          </p>
        </div>
        <span className="rounded-full bg-[#4338ca] px-3 py-1 text-xs font-medium text-white">{STATUS_LABEL[job.status]}</span>
      </div>
      {job.address && (
        <p className="mt-3 flex items-center gap-1.5 text-sm text-slate-600">
          <MapPin size={14} aria-hidden />
          {job.address}
        </p>
      )}
      <Link
        to={`/partner/work/${job.id}`}
        className="mt-4 inline-block rounded-lg bg-[#ff8a3d] px-4 py-2 text-sm font-medium text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4338ca]"
      >
        Open job
      </Link>
    </div>
  );
}