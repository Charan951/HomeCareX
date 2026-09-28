import { NOTIFICATIONS } from "../../../mocks/customerMockData";

const ICON: Record<string, string> = { booking: "📦", offer: "🏷️", reminder: "⏰" };

export default function Notifications() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-ink">Notifications</h1>
        <p className="text-muted text-sm mt-1">Booking updates, offers, and reminders.</p>
      </div>

      <div className="space-y-2">
        {NOTIFICATIONS.map((n) => (
          <div key={n.id} className={`flex gap-3 p-4 rounded border ${n.read ? "bg-panel border-line" : "bg-brand-soft/40 border-brand-soft"}`}>
            <div className="text-xl">{ICON[n.type]}</div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-medium text-ink text-sm">{n.title}</span>
                <span className="text-xs text-muted">{n.time}</span>
              </div>
              <p className="text-sm text-muted mt-0.5">{n.message}</p>
            </div>
            {!n.read && <span className="h-2 w-2 rounded-full bg-brand mt-1.5 shrink-0" />}
          </div>
        ))}
      </div>
    </div>
  );
}
