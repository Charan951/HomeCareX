import { useState } from "react";
import { Link } from "react-router-dom";
import { BOOKINGS, BookingStatus } from "../../../mocks/customerMockData";
import { statusBadgeClass } from "../../../utils/statusBadge";

const TABS = ["Upcoming", "Live", "Completed", "Cancelled"] as const;
type Tab = (typeof TABS)[number];

function matchesTab(status: BookingStatus, tab: Tab) {
  if (tab === "Upcoming") return status === "Confirmed" || status === "Partner Assigned";
  if (tab === "Live") return status === "En Route" || status === "Arrived" || status === "In Progress";
  if (tab === "Completed") return status === "Completed";
  return status === "Cancelled";
}

export default function Bookings() {
  const [tab, setTab] = useState<Tab>("Live");
  const filtered = BOOKINGS.filter((b) => matchesTab(b.status, tab));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-ink">Bookings</h1>
        <p className="text-muted text-sm mt-1">Track, manage, and revisit your service bookings.</p>
      </div>

      <div className="flex gap-2 border-b border-line">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t ? "border-brand text-brand" : "border-transparent text-muted hover:text-ink"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-muted text-sm py-8 text-center">No {tab.toLowerCase()} bookings.</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((b) => (
            <Link
              key={b.id}
              to={b.status === "In Progress" ? "/tracking" : `/bookings/${b.id}`}
              className="block bg-panel border border-line rounded p-4 hover:border-brand transition-colors"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-medium text-ink">{b.service}</div>
                  <div className="text-xs text-muted mt-0.5">{b.category} · {b.id}</div>
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${statusBadgeClass(b.status)}`}>{b.status}</span>
              </div>
              <div className="flex items-center justify-between mt-3 text-sm">
                <span className="text-muted">{b.scheduledAt}</span>
                <span className="font-medium text-ink">₹{b.price}</span>
              </div>
              {b.partner && <div className="text-xs text-muted mt-1">Partner: {b.partner.name} · ⭐ {b.partner.rating}</div>}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
