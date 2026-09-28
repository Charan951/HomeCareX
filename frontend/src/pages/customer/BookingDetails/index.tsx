import { useParams, Link } from "react-router-dom";
import { BOOKINGS, TRACKING_TIMELINE } from "../../../mocks/customerMockData";
import { statusBadgeClass } from "../../../utils/statusBadge";
import { customerPath } from "@/routes/customerPath";

export default function BookingDetails() {
  const { id } = useParams();
  const booking = BOOKINGS.find((b) => b.id === id) ?? BOOKINGS[0];

  const addon = 100;
  const tax = Math.round((booking.price + addon) * 0.05);
  const total = booking.price + addon + tax;

  return (
    <div className="space-y-6">
      <div>
      <Link to={customerPath("/bookings")} className="text-sm text-brand font-medium">← Back to bookings</Link>
      </div>

      <div className="bg-panel border border-line rounded p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold text-ink">{booking.service}</h1>
            <p className="text-muted text-sm mt-1">{booking.id} · {booking.category}</p>
          </div>
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusBadgeClass(booking.status)}`}>{booking.status}</span>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 mt-6 text-sm">
          <div>
            <div className="text-muted text-xs">Scheduled</div>
            <div className="text-ink mt-0.5">{booking.scheduledAt}</div>
          </div>
          <div>
            <div className="text-muted text-xs">Address</div>
            <div className="text-ink mt-0.5">{booking.address}</div>
          </div>
          <div>
            <div className="text-muted text-xs">Partner</div>
            <div className="text-ink mt-0.5">{booking.partner ? `${booking.partner.name} · ⭐ ${booking.partner.rating}` : "Not yet assigned"}</div>
          </div>
          <div>
            <div className="text-muted text-xs">Payment method</div>
            <div className="text-ink mt-0.5">{booking.paymentMethod}</div>
          </div>
        </div>
      </div>

      <div className="bg-panel border border-line rounded p-6">
        <h3 className="font-semibold text-ink mb-4">Status timeline</h3>
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

      <div className="bg-panel border border-line rounded p-6">
        <h3 className="font-semibold text-ink mb-4">Price breakdown</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-muted">Base price</span><span className="text-ink">₹{booking.price}</span></div>
          <div className="flex justify-between"><span className="text-muted">Add-ons</span><span className="text-ink">₹{addon}</span></div>
          <div className="flex justify-between"><span className="text-muted">Taxes & fees</span><span className="text-ink">₹{tax}</span></div>
          <div className="flex justify-between font-semibold pt-2 border-t border-line"><span className="text-ink">Total</span><span className="text-ink">₹{total}</span></div>
        </div>
      </div>
    </div>
  );
}
