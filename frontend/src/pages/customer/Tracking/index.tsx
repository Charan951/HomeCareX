import { ACTIVE_BOOKING, TRACKING_TIMELINE } from "../../../mocks/customerMockData";

export default function Tracking() {
  const b = ACTIVE_BOOKING;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-ink">Tracking</h1>
        <p className="text-muted text-sm mt-1">Live status for your ongoing booking.</p>
      </div>

      <div className="bg-panel border border-line rounded overflow-hidden">
        <div className="h-48 bg-canvas flex items-center justify-center text-muted text-sm">
          🗺️ Live map — partner location & ETA
        </div>
        <div className="p-4 flex items-center justify-between">
          <div>
            <div className="font-medium text-ink text-sm">{b.partner?.name}</div>
            <div className="text-xs text-muted">Arriving in ~8 min</div>
          </div>
          <div className="flex gap-2">
            <button className="text-sm bg-brand-soft text-brand px-3 py-1.5 rounded font-medium">Chat</button>
            <button className="text-sm bg-brand text-white px-3 py-1.5 rounded font-medium">Call</button>
          </div>
        </div>
      </div>

      <div className="bg-panel border border-line rounded p-6">
        <h3 className="font-semibold text-ink mb-4">{b.service} · {b.id}</h3>
        <ol className="space-y-3">
          {TRACKING_TIMELINE.map((t, i) => (
            <li key={i} className="flex items-center gap-3 text-sm">
              <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${t.done ? "bg-brand" : "bg-line"}`} />
              <span className={t.done ? "text-ink" : "text-muted"}>{t.step}</span>
              {t.time && <span className="text-xs text-muted ml-auto">{t.time}</span>}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
