import { useEffect } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2 } from 'lucide-react';
import { bookingApi, type NormalizedApiError } from '@/services/bookingApi';
import { useBookingDraftStore } from '@/features/booking';
import { ErrorState, LoadingState } from '@/components/customer';
import { formatSlotLabel } from '../Book/components/SlotPicker';
import type { BookingStatus, BookingView } from '@/types/booking';
import { BOOKINGS } from '../../../mocks/customerMockData';
import { statusBadgeClass } from '../../../utils/statusBadge';
import { customerPath } from '@/routes/customerPath';

function MockBookingDetails({ id }: { id: string | undefined }) {
  const booking = BOOKINGS.find((b) => b.id === id) ?? BOOKINGS[0];

  return (
    <div className="space-y-6">
      <div>
        <Link to={customerPath('/bookings')} className="text-sm text-brand font-medium">← Back to bookings</Link>
      </div>

      <div className="bg-panel border border-line rounded p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-semibold text-ink">{booking.service}</h1>
            <p className="text-muted text-sm mt-1">{booking.id} · {booking.category}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusBadgeClass(booking.status)}`}>{booking.status}</span>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-300">
              Payment Pending
            </span>
          </div>
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
            <div className="text-ink mt-0.5">{booking.partner ? `${booking.partner.name} · ⭐ ${booking.partner.rating}` : 'Not yet assigned'}</div>
          </div>
          <div>
            <div className="text-muted text-xs">Payment status</div>
            <div className="text-amber-700 font-medium mt-0.5">Pending</div>
          </div>
        </div>
      </div>
    </div>
  );
}

const STATUS_LABEL: Record<BookingStatus, string> = {
  pending_payment: 'Awaiting payment',
  confirmed: 'Confirmed',
  created: 'Confirmed',
  searching_for_partner: 'Finding a partner',
  assigned: 'Partner Assigned',
  en_route: 'En Route',
  arrived: 'Arrived',
  in_progress: 'In Progress',
  completed: 'Completed',
  rated: 'Completed',
  cancelled_by_customer: 'Cancelled',
  cancelled_by_partner: 'Partner cancelled, reassigning',
  no_show: 'No show',
  disputed: 'Under review',
};

const OBJECT_ID = /^[0-9a-fA-F]{24}$/;
const rupees = (n: number) => `₹${n.toLocaleString('en-IN')}`;

function formatDate(iso: string): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

function LiveBookingDetails({ id }: { id: string }) {
  const location = useLocation();
  const justBooked = Boolean((location.state as { justBooked?: boolean } | null)?.justBooked);

  useEffect(() => {
    if (justBooked) useBookingDraftStore.getState().clearDraft();
  }, [justBooked]);

  const { data: booking, isError, error, refetch } = useQuery<BookingView, NormalizedApiError>({
    queryKey: ['booking', id],
    queryFn: () => bookingApi.getBooking(id),
  });

  if (isError) {
    return (
      <ErrorState
        title="Couldn't load this booking"
        message={error?.message ?? 'Something went wrong. Please try again.'}
        onRetry={() => void refetch()}
      />
    );
  }
  if (!booking) return <LoadingState label="Loading your booking…" />;

  const base = booking.priceSnapshot.lines.find((l) => l.kind === 'BASE');
  const addOns = booking.priceSnapshot.lines.filter((l) => l.kind === 'ADDON');
  const a = booking.addressSnapshot;
  const label = STATUS_LABEL[booking.status] ?? booking.status;
  const isPaymentPending = (booking.paymentStatus ?? 'PENDING') === 'PENDING';

  return (
    <div className="space-y-6">
      <div>
        <Link to={customerPath('/bookings')} className="text-sm text-brand font-medium">← Back to bookings</Link>
      </div>

      {/* Booking Confirmed Banner */}
      {justBooked && booking.status === 'confirmed' && (
        <div role="status" className="flex items-start gap-3 rounded border border-green-200 bg-green-50 px-4 py-3 text-green-800">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <div>
            <p className="font-semibold">Booking confirmed!</p>
            <p className="text-sm">
              {base?.name ?? 'Your service'} is booked for {formatDate(booking.date)}, {formatSlotLabel(booking.slot)}.
            </p>
          </div>
        </div>
      )}

      {/* Main Details Card */}
      <div className="bg-panel border border-line rounded p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-ink">{base?.name ?? 'Booking'}</h1>
            <p className="text-muted text-sm mt-1">Booking ID · {booking._id}</p>
          </div>
          
          {/* Dual Status Badges */}
          <div className="flex items-center gap-2">
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${statusBadgeClass(label)}`}>
              {label}
            </span>
            <span
              className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap flex items-center gap-1.5 ${
                isPaymentPending
                  ? 'bg-amber-50 text-amber-700 border border-amber-300'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-300'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${isPaymentPending ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
              Payment {booking.paymentStatus ?? 'PENDING'}
            </span>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 mt-6 text-sm">
          <div>
            <div className="text-muted text-xs">Scheduled</div>
            <div className="text-ink mt-0.5">{formatDate(booking.date)} · {formatSlotLabel(booking.slot)}</div>
          </div>
          <div>
            <div className="text-muted text-xs">Address</div>
            <div className="text-ink mt-0.5">{a.line1}, {a.city}, {a.state} — {a.pincode}</div>
          </div>
          <div>
            <div className="text-muted text-xs">Partner</div>
            <div className="text-ink mt-0.5">{booking.partnerId ? 'Assigned' : 'Not yet assigned'}</div>
          </div>
          <div>
            <div className="text-muted text-xs">Quantity</div>
            <div className="text-ink mt-0.5">{booking.quantity}</div>
          </div>
        </div>
      </div>

      {/* Status Timeline */}
      <div className="bg-panel border border-line rounded p-6">
        <h3 className="font-semibold text-ink mb-4">Status timeline</h3>
        <ol className="space-y-3">
          {booking.statusHistory.map((h, i) => (
            <li key={i} className="flex items-center gap-3 text-sm">
              <span className="h-2.5 w-2.5 rounded-full shrink-0 bg-brand" />
              <span className="text-ink">{STATUS_LABEL[h.to as BookingStatus] ?? h.to}</span>
              <span className="text-xs text-muted ml-auto">
                {new Date(h.at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}
              </span>
            </li>
          ))}
        </ol>
      </div>

      {/* Price Breakdown with Payment Alert */}
      <div className="bg-panel border border-line rounded p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-ink">Price breakdown</h3>
          <span className="text-xs font-medium px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
            Payment Status: {booking.paymentStatus ?? 'PENDING'}
          </span>
        </div>
        <div className="space-y-2 text-sm">
          {base && (
            <div className="flex justify-between">
              <span className="text-muted">Base price × {base.quantity}</span>
              <span className="text-ink">{rupees(base.amount)}</span>
            </div>
          )}
          {addOns.map((l) => (
            <div key={String(l.refId)} className="flex justify-between">
              <span className="text-muted">{l.name}</span>
              <span className="text-ink">+{rupees(l.amount)}</span>
            </div>
          ))}
          {booking.priceSnapshot.discount > 0 && (
            <div className="flex justify-between">
              <span className="text-muted">Discount</span>
              <span className="text-ink">−{rupees(booking.priceSnapshot.discount)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted">Convenience fee</span>
            <span className="text-ink">{rupees(booking.priceSnapshot.convenienceFee)}</span>
          </div>
          <div className="flex justify-between font-semibold pt-2 border-t border-line">
            <span className="text-ink">Total</span>
            <span className="text-ink">{rupees(booking.priceSnapshot.total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BookingDetails() {
  const { id } = useParams();
  return id && OBJECT_ID.test(id) ? <LiveBookingDetails id={id} /> : <MockBookingDetails id={id} />;
}