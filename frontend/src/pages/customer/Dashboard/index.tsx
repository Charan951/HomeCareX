import { Link } from "react-router-dom";
import { BOOKINGS, CATEGORIES, WALLET_BALANCE, PROFILE } from "../../../mocks/customerMockData";
import { statusBadgeClass } from "../../../utils/statusBadge";
import { customerPath } from "@/routes/customerPath";

const upcoming = BOOKINGS.filter((b) => b.status !== "Completed" && b.status !== "Cancelled").length;
const completed = BOOKINGS.filter((b) => b.status === "Completed").length;
const totalSpent = BOOKINGS.filter((b) => b.status === "Completed").reduce((sum, b) => sum + b.price, 0);

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-ink">Welcome back, {PROFILE.name.split(" ")[0]} 👋</h2>
        <p className="text-muted text-sm mt-1">Here's an overview of your account.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Upcoming bookings", value: upcoming },
          { label: "Completed bookings", value: completed },
          { label: "Wallet balance", value: `₹${WALLET_BALANCE}` },
          { label: "Total spent", value: `₹${totalSpent.toLocaleString()}` },
        ].map((s) => (
          <div key={s.label} className="bg-panel border border-line rounded p-4">
            <div className="text-2xl font-semibold text-ink">{s.value}</div>
            <div className="text-muted text-xs mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-panel border border-line rounded p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-ink">Recent bookings</h3>
          <Link to={customerPath("/bookings")} className="text-sm text-brand font-medium">View all</Link>
        </div>
        <div className="space-y-3">
          {BOOKINGS.slice(0, 4).map((b) => (
            <Link
              key={b.id}
              to={b.status === "In Progress" ? "/tracking" : `/bookings/${b.id}`}
              className="flex items-center justify-between py-2 border-b border-line last:border-0"
            >
              <div>
                <div className="text-sm font-medium text-ink">{b.service}</div>
                <div className="text-xs text-muted">{b.scheduledAt} · {b.address}</div>
              </div>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusBadgeClass(b.status)}`}>{b.status}</span>
            </Link>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-ink">Browse categories</h3>
          <Link to={customerPath("/categories")} className="text-sm text-brand font-medium">View all</Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {CATEGORIES.slice(0, 4).map((c) => (
            <Link key={c.id} to={customerPath("/services")} className="bg-panel border border-line rounded p-4 hover:border-brand transition-colors">
              <div className="text-2xl mb-2">{c.icon}</div>
              <div className="text-sm font-medium text-ink">{c.name}</div>
              <div className="text-xs text-muted mt-1">{c.serviceCount} services</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
