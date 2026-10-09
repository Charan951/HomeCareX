import type { JobRequest } from "@/types/partner";

import { emitPartnerNewJob } from "./mockPartnerEvents";

import {
  assignBookingToPartner,
  findEligiblePartners,
  getMockPartner,
  isPartnerEligible,
  type MockConfirmedBooking,
  type MockPartner,
} from "./mockPartnerJobs";

import {
  expireMockJob,
  getMockJobState,
  registerMockJob,
  setAcceptGuard,
  subscribeToJobDecisions,
  type JobDecisionEvent,
} from "./mockPartnerJobActions";

/* =========================================================
   CONSTANTS
========================================================= */

const OFFER_DURATION_MS = 60 * 1000;

/* =========================================================
   OFFER SESSION

   One session per booking. The booking is offered to ONE
   partner at a time, each for 60 seconds:

   Partner A (60 s) → rejected / expired → Partner B (60 s) → ...
   Accepted by anyone → session ends.
========================================================= */

interface OfferSession {
  booking: MockConfirmedBooking;

  eligiblePartners: MockPartner[];

  currentIndex: number;

  currentJobId: string;

  timer?: number;
}

const sessions = new Map<string, OfferSession>();

const clearTimer = (session: OfferSession) => {
  if (session.timer) {
    window.clearTimeout(session.timer);

    session.timer = undefined;
  }
};

/* =========================================================
   CREATE OFFER FOR ONE PARTNER
========================================================= */

const createOfferForPartner = (
  session: OfferSession,
  partner: MockPartner,
): JobRequest => {
  const now = Date.now();

  const job: JobRequest = {
    id: `job-${session.booking.id}-partner-${partner.id}-${now}`,

    service: session.booking.service,

    area: session.booking.area,

    address: session.booking.address,

    price: session.booking.price,

    scheduledAt: session.booking.scheduledAt,

    expiresAt: new Date(now + OFFER_DURATION_MS).toISOString(),
  };

  /* Register first, so Accept / Reject can find the job */
  registerMockJob(job, partner.id);

  session.currentJobId = job.id;

  console.log("[Mock Reoffer] =======================");
  console.log("[Mock Reoffer] Offering job to:", partner.name);
  console.log("[Mock Reoffer] Partner ID:", partner.id);
  console.log("[Mock Reoffer] Job ID:", job.id);
  console.log("[Mock Reoffer] Offer expires in 60 seconds:", job.expiresAt);

  /* One timer per offer */
  session.timer = window.setTimeout(() => {
    expireMockJob(job.id);
  }, OFFER_DURATION_MS);

  /* partner:new_job */
  emitPartnerNewJob(job, partner.id);

  return job;
};

/* =========================================================
   OFFER TO THE NEXT PARTNER IN THE LIST
========================================================= */

const offerFromCurrentIndex = (session: OfferSession): JobRequest | null => {
  while (session.currentIndex < session.eligiblePartners.length) {
    const partner = session.eligiblePartners[session.currentIndex];

    if (!isPartnerEligible(partner, session.booking)) {
      console.log(
        "[Mock Reoffer] Skipping, no longer eligible:",
        partner.name,
      );

      session.currentIndex += 1;

      continue;
    }

    return createOfferForPartner(session, partner);
  }

  console.log("[Mock Reoffer] =======================");
  console.log("[Mock Reoffer] No more eligible partners.");
  console.log("[Mock Reoffer] Booking remains unassigned.");

  sessions.delete(session.booking.id);

  return null;
};

/* =========================================================
   START RE-OFFER SESSION
========================================================= */

export const startReofferSession = (booking: MockConfirmedBooking) => {
  stopReofferSession(booking.id);

  const eligiblePartners = findEligiblePartners(booking);

  console.log(
    "[Mock Reoffer] Eligible partners:",
    eligiblePartners.map((partner) => ({
      id: partner.id,
      name: partner.name,
    })),
  );

  if (eligiblePartners.length === 0) {
    console.log("[Mock Reoffer] No eligible partners.");

    return null;
  }

  const session: OfferSession = {
    booking,

    eligiblePartners: [...eligiblePartners],

    currentIndex: 0,

    currentJobId: "",
  };

  sessions.set(booking.id, session);

  return offerFromCurrentIndex(session);
};

/* =========================================================
   REACT TO ACCEPT / REJECT / EXPIRE

   ACCEPTED           → save the slot for that partner, stop
   REJECTED / EXPIRED → next partner gets a NEW 60-second offer
========================================================= */

const handleDecision = (event: JobDecisionEvent) => {
  const session = Array.from(sessions.values()).find(
    (item) => item.currentJobId === event.jobId,
  );

  if (!session) {
    return;
  }

  clearTimer(session);

  if (event.decision === "ACCEPTED") {
    console.log("[Mock Reoffer] Job accepted. Reoffer stopped.");

    assignBookingToPartner(event.partnerId, session.booking);

    sessions.delete(session.booking.id);

    return;
  }

  console.log(
    event.decision === "REJECTED"
      ? "[Mock Reoffer] Job rejected. Moving to next partner."
      : "[Mock Reoffer] 60-second offer expired. Moving to next partner.",
  );

  session.currentIndex += 1;

  offerFromCurrentIndex(session);
};

subscribeToJobDecisions(handleDecision);

/* =========================================================
   ACCEPT GUARD

   Accept is refused if the partner is no longer eligible.
========================================================= */

setAcceptGuard((job, partnerId) => {
  const session = Array.from(sessions.values()).find(
    (item) => item.currentJobId === job.id,
  );

  if (!session) {
    return "This booking is no longer being offered.";
  }

  const partner = getMockPartner(partnerId);

  if (!partner || !isPartnerEligible(partner, session.booking)) {
    return "You are no longer eligible for this job.";
  }

  return null;
});

/* =========================================================
   GET / STOP SESSIONS
========================================================= */

export const getReofferSession = (bookingId: string) => {
  return sessions.get(bookingId);
};

export const stopReofferSession = (bookingId: string) => {
  const session = sessions.get(bookingId);

  if (!session) {
    return;
  }

  clearTimer(session);

  sessions.delete(bookingId);

  if (
    session.currentJobId &&
    getMockJobState(session.currentJobId)?.state === "OFFERED"
  ) {
    expireMockJob(session.currentJobId);
  }

  console.log("[Mock Reoffer] Session stopped:", bookingId);
};

export const stopAllReofferSessions = () => {
  Array.from(sessions.keys()).forEach((bookingId) => {
    stopReofferSession(bookingId);
  });
};