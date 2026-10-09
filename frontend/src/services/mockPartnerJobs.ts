import type { JobRequest } from "@/types/partner";

import {
  expireMockJob,
  getMockJob,
  getOpenJobsForPartner,
  registerMockJob,
} from "./mockPartnerJobActions";

/* =========================================================
   TYPES
========================================================= */

export interface MockPartner {
  id: string;
  name: string;

  approved: boolean;
  online: boolean;

  services: string[];
  areas: string[];

  bookings: MockBooking[];
}

export interface MockBooking {
  id: string;
  service: string;
  area: string;
  scheduledAt: string;
  durationMinutes: number;
  status: "CONFIRMED" | "COMPLETED" | "CANCELLED";
}

export interface MockConfirmedBooking {
  id: string;
  service: string;
  area: string;
  address?: string;
  price: number;
  scheduledAt: string;
  durationMinutes: number;
}

/* =========================================================
   DEMO SEED JOBS

   Keep this false to test the real flow: a card appears only
   after a booking is CONFIRMED and the partner is eligible.
========================================================= */

const SHOW_DEMO_SEED_JOBS = false;

/* =========================================================
   MOCK PARTNERS
========================================================= */

const mockPartners: MockPartner[] = [
  {
    id: "partner-1",
    name: "Ravi Kumar",

    approved: true,
    online: true,

    services: [
      "Deep home cleaning",
      "Regular home cleaning",
      "Bathroom cleaning",
    ],

    areas: ["Gachibowli", "Kondapur", "Madhapur"],

    bookings: [],
  },

  /* SECOND ELIGIBLE PARTNER */

  {
    id: "partner-5",
    name: "Kiran",

    approved: true,
    online: true,

    services: ["Deep home cleaning", "Regular home cleaning"],

    areas: ["Gachibowli", "Kondapur"],

    bookings: [],
  },

  {
    id: "partner-2",
    name: "Suresh Kumar",

    approved: true,
    online: true,

    services: [
      "Washing machine repair",
      "AC repair",
      "Refrigerator repair",
    ],

    areas: ["Kondapur", "Miyapur", "Hitech City"],

    bookings: [],
  },

  {
    id: "partner-3",
    name: "Ramesh",

    approved: false,
    online: true,

    services: ["Deep home cleaning"],

    areas: ["Gachibowli"],

    bookings: [],
  },

  {
    id: "partner-4",
    name: "Arjun",

    approved: true,
    online: false,

    services: ["Deep home cleaning", "Bathroom cleaning"],

    areas: ["Gachibowli", "Kondapur"],

    bookings: [],
  },
];

/* =========================================================
   HELPERS
========================================================= */

const normalize = (value: string) => value.trim().toLowerCase();

const serviceMatches = (partner: MockPartner, service: string) => {
  const requestedService = normalize(service);

  return partner.services.some(
    (item) => normalize(item) === requestedService,
  );
};

const areaMatches = (partner: MockPartner, area: string) => {
  const requestedArea = normalize(area);

  return partner.areas.some((item) => normalize(item) === requestedArea);
};

const hasScheduleConflict = (
  partner: MockPartner,
  booking: MockConfirmedBooking,
) => {
  const requestedStart = new Date(booking.scheduledAt).getTime();

  const requestedEnd = requestedStart + booking.durationMinutes * 60 * 1000;

  return partner.bookings.some((existingBooking) => {
    if (existingBooking.status !== "CONFIRMED") {
      return false;
    }

    const existingStart = new Date(existingBooking.scheduledAt).getTime();

    const existingEnd =
      existingStart + existingBooking.durationMinutes * 60 * 1000;

    return requestedStart < existingEnd && requestedEnd > existingStart;
  });
};

/* =========================================================
   IS PARTNER ELIGIBLE

   approved + online + service + area + no conflict.
   Used when the list is built, right before each re-offer,
   and again when a partner accepts.
========================================================= */

export const isPartnerEligible = (
  partner: MockPartner,
  booking: MockConfirmedBooking,
): boolean => {
  if (!partner.approved) {
    return false;
  }

  if (!partner.online) {
    return false;
  }

  if (!serviceMatches(partner, booking.service)) {
    return false;
  }

  if (!areaMatches(partner, booking.area)) {
    return false;
  }

  if (hasScheduleConflict(partner, booking)) {
    return false;
  }

  return true;
};

/* =========================================================
   FIND ELIGIBLE PARTNERS
========================================================= */

export const findEligiblePartners = (
  booking: MockConfirmedBooking,
): MockPartner[] => {
  return mockPartners.filter((partner) =>
    isPartnerEligible(partner, booking),
  );
};

/* =========================================================
   ASSIGN BOOKING TO PARTNER

   Called when a partner accepts. From now on that time slot
   counts as a conflict for this partner.
========================================================= */

export const assignBookingToPartner = (
  partnerId: string,
  booking: MockConfirmedBooking,
) => {
  const partner = mockPartners.find((item) => item.id === partnerId);

  if (!partner) {
    console.log("[Mock P0] Partner not found:", partnerId);

    return false;
  }

  if (partner.bookings.some((item) => item.id === booking.id)) {
    return true;
  }

  partner.bookings.push({
    id: booking.id,
    service: booking.service,
    area: booking.area,
    scheduledAt: booking.scheduledAt,
    durationMinutes: booking.durationMinutes,
    status: "CONFIRMED",
  });

  console.log("[Mock P0] Booking assigned:", booking.id, "→", partner.name);

  return true;
};

/* =========================================================
   JOBS SHOWN ON /partner/jobs

   Returns the offers that are open for this partner right now.
========================================================= */

export const mockJobRequests = async (
  partnerId: string = "partner-1",
): Promise<JobRequest[]> => {
  await new Promise<void>((resolve) => {
    window.setTimeout(resolve, 400);
  });

  if (SHOW_DEMO_SEED_JOBS) {
    const now = Date.now();

    const seeds: JobRequest[] = [
      {
        id: "r1",
        service: "Deep home cleaning",
        area: "Gachibowli",
        price: 1499,
        scheduledAt: new Date(now + 90 * 60 * 1000).toISOString(),
        expiresAt: new Date(now + 60 * 1000).toISOString(),
      },
      {
        id: "r2",
        service: "Washing machine repair",
        area: "Kondapur",
        price: 599,
        scheduledAt: new Date(now + 180 * 60 * 1000).toISOString(),
        expiresAt: new Date(now + 3 * 60 * 1000).toISOString(),
      },
    ];

    seeds.forEach((job) => {
      if (!getMockJob(job.id)) {
        registerMockJob(job, partnerId);
      }
    });
  }

  const open = getOpenJobsForPartner(partnerId);

  console.log(
    "[Mock Jobs] Open jobs for",
    partnerId,
    ":",
    open.map((job) => job.id),
  );

  return open;
};

/* =========================================================
   GET PARTNER
========================================================= */

export const getMockPartner = (partnerId: string) => {
  return mockPartners.find((partner) => partner.id === partnerId);
};

/* =========================================================
   SET PARTNER ONLINE / OFFLINE

   Going offline ends any offer that is waiting for this
   partner, so it moves on to the next partner right away.
========================================================= */

export const setMockPartnerOnline = (partnerId: string, online: boolean) => {
  const partner = mockPartners.find((item) => item.id === partnerId);

  if (!partner) {
    console.log("[Mock P0] Partner not found:", partnerId);

    return false;
  }

  if (partner.online === online) {
    return true;
  }

  partner.online = online;

  console.log(
    "[Mock P0] Partner status:",
    partner.name,
    online ? "ONLINE" : "OFFLINE",
  );

  if (!online) {
    getOpenJobsForPartner(partnerId).forEach((job) => {
      expireMockJob(job.id);
    });
  }

  return true;
};

/* =========================================================
   GET ALL MOCK PARTNERS
========================================================= */

export const getMockPartners = () => {
  return mockPartners;
};

/* =========================================================
   RESET PARTNER BOOKINGS (dev only)
========================================================= */

export const resetMockPartnerBookings = () => {
  mockPartners.forEach((partner) => {
    partner.bookings = [];
  });

  console.log("[Mock P0] All partner bookings cleared.");
};