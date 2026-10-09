import { confirmMockBooking } from "@/services/mockBookingFlow";

/* Each click books a slot 3 hours after the previous one.
   A booking lasts 2 hours, so slots never overlap. */

const SLOT_GAP_MS = 3 * 60 * 60 * 1000;

let slotCount = 0;

export default function MockConfirmedBookingButton() {
  const createConfirmedBooking = () => {
    slotCount += 1;

    confirmMockBooking({
      id: `booking-${Date.now()}`,
      service: "Deep home cleaning",
      area: "Gachibowli",
      address: "Flat 402, Sai Residency, Road No. 3, Gachibowli, Hyderabad",
      price: 1499,
      scheduledAt: new Date(Date.now() + slotCount * SLOT_GAP_MS).toISOString(),
      durationMinutes: 120,
    });
  };

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={createConfirmedBooking}
        className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:opacity-90"
      >
        Simulate Confirmed Booking
      </button>

      {/* <button
        type="button"
        onClick={resetMockData}
        className="rounded-lg border border-line bg-white px-4 py-2 text-sm font-medium text-ink hover:bg-canvas"
      >
        Reset mock data
      </button> */}
    </div>
  );
}