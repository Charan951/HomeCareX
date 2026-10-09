import { startReofferSession } from "./mockJobReoffer";

import type { MockConfirmedBooking } from "./mockPartnerJobs";

/* =========================================================
   CONFIRM MOCK BOOKING
========================================================= */

export const confirmMockBooking = (booking: MockConfirmedBooking) => {
  console.log("[Mock Booking] =======================");

  console.log("[Mock Booking] Booking CONFIRMED:", booking);

  /* -------------------------------------------------------
     P0 FLOW

     CONFIRMED
        ↓
     Find eligible partners
        ↓
     Create 60-second offer
        ↓
     partner:new_job
        ↓
     Rejected / expired → next partner (new 60-second offer)
  ------------------------------------------------------- */

  const firstOffer = startReofferSession(booking);

  /* -------------------------------------------------------
     NO ELIGIBLE PARTNER
  ------------------------------------------------------- */

  if (!firstOffer) {
    console.log("[Mock Booking] No eligible partner found.");

    return null;
  }

  /* -------------------------------------------------------
     FIRST OFFER CREATED
  ------------------------------------------------------- */

  console.log("[Mock Booking] First 60-second offer created:", firstOffer);

  return firstOffer;
};