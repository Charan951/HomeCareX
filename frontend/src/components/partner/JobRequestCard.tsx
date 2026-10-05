import { useEffect, useState } from "react";
import { MapPin, Timer } from "lucide-react";
import type { JobRequest } from "@/types/partner";

const secondsLeft = (expiresAt: string) => Math.max(0, Math.round((new Date(expiresAt).getTime() - Date.now()) / 1000));
const clock = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

interface Props {
  request: JobRequest;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
}

export default function JobRequestCard({ request, onAccept, onReject }: Props) {
  const [left, setLeft] = useState(() => secondsLeft(request.expiresAt));

  useEffect(() => {
    setLeft(secondsLeft(request.expiresAt));
    const t = setInterval(() => setLeft(secondsLeft(request.expiresAt)), 1000);
    return () => clearInterval(t);
  }, [request.expiresAt]);

  const expired = left === 0;
  const when = new Date(request.scheduledAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

  return (
    <li className="rounded border border-line bg-panel p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-ink">{request.service}</p>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-muted">
            <MapPin size={13} aria-hidden />
            {request.area} · {when} · ₹{request.price.toLocaleString("en-IN")}
          </p>
        </div>
        <span
          className={`flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
            expired ? "bg-canvas text-muted" : "bg-accent-soft text-[#b45309]"
          }`}
          role="timer"
          aria-label={expired ? "Expired" : `${left} seconds left to respond`}
        >
          <Timer size={12} aria-hidden />
          {expired ? "Expired" : clock(left)}
        </span>
      </div>
      <div className="mt-3 flex gap-2">
        <button
          onClick={() => onReject(request.id)}
          className="rounded border border-line px-3 py-1.5 text-sm text-ink hover:bg-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
        >
          Reject
        </button>
        <button
          onClick={() => onAccept(request.id)}
          disabled={expired}
          className="rounded bg-brand px-3 py-1.5 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
        >
          Accept
        </button>
      </div>
    </li>
  );
}