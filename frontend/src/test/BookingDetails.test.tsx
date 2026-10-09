import "@testing-library/jest-dom/vitest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import type { BookingDetailView } from "../types/bookingDetail";
import {
  buildPriceBreakdown,
  buildTimeline,
  paymentSummary,
} from "../pages/customer/BookingDetails/bookingDetailModel";

const getBookingDetail = vi.fn();
const decideExtraCharge = vi.fn();

vi.mock("@/services/bookingApi", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/services/bookingApi")>();
  return {
    ...actual,
    bookingApi: {
      ...actual.bookingApi,
      getBookingDetail: (...a: unknown[]) => getBookingDetail(...a),
      decideExtraCharge: (...a: unknown[]) => decideExtraCharge(...a),
    },
  };
});

import BookingDetails from "../pages/customer/BookingDetails";

const ID = "65f0c0ffee00000000a1b2c3";

const detail = (over: Partial<BookingDetailView> = {}): BookingDetailView =>
  ({
    _id: ID,
    customerId: "c1",
    serviceId: "s1",
    quantity: 1,
    addOns: [],
    addressSnapshot: {
      line1: "12 MG Road",
      city: "Nellore",
      state: "Andhra Pradesh",
      pincode: "524001",
    },
    date: "2026-10-12",
    slot: "10:00-12:00",
    priceSnapshot: {
      currency: "INR",
      lines: [
        {
          kind: "BASE",
          refId: "s1",
          name: "Deep Cleaning",
          unitPrice: 1200,
          quantity: 1,
          amount: 1200,
        },
      ],
      subtotal: 1200,
      discount: 100,
      couponCode: "SAVE100",
      convenienceFee: 49,
      total: 1149,
      computedAt: "2026-10-01T00:00:00.000Z",
    },
    status: "assigned",
    paymentStatus: "PAID",
    statusHistory: [
      {
        from: null,
        to: "confirmed",
        at: "2026-10-09T05:00:00.000Z",
        actorRole: "system",
      },
      {
        from: "confirmed",
        to: "assigned",
        at: "2026-10-09T06:00:00.000Z",
        actorRole: "partner",
      },
    ],
    createdAt: "2026-10-09T05:00:00.000Z",
    updatedAt: "2026-10-09T06:00:00.000Z",
    partnerId: "p1",
    partner: {
      name: "Ramesh Sharma",
      phone: "+919876543210",
      rating: 4.7,
      ratingCount: 31,
    },
    startOtp: null,
    extraCharges: [],
    extraChargesApprovedTotal: 0,
    ...over,
  }) as BookingDetailView;

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[`/customer/bookings/${ID}`]}>
        <Routes>
          <Route path="/customer/bookings/:id" element={<BookingDetails />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  getBookingDetail.mockReset();
  decideExtraCharge.mockReset();
});

describe("buildTimeline", () => {
  it("marks earlier steps done and the current one current", () => {
    const steps = buildTimeline(detail({ status: "en_route" }));
    expect(steps.find((s) => s.key === "assigned")?.state).toBe("done");
    expect(steps.find((s) => s.key === "en_route")?.state).toBe("current");
    expect(steps.find((s) => s.key === "arrived")?.state).toBe("upcoming");
  });

  it("finishes every step once completed", () => {
    expect(
      buildTimeline(detail({ status: "completed" })).every(
        (s) => s.state === "done",
      ),
    ).toBe(true);
  });

  it("keeps only the steps a cancelled booking reached, then ends in a failed step", () => {
    const steps = buildTimeline(detail({ status: "cancelled_by_customer" }));
    expect(steps.map((s) => s.key)).toEqual([
      "confirmed",
      "assigned",
      "cancelled_by_customer",
    ]);
    expect(steps[steps.length - 1].state).toBe("failed");
  });
});

describe("price and payment", () => {
  it("adds only approved extra charges on top of the total", () => {
    const model = buildPriceBreakdown(
      detail({ extraChargesApprovedTotal: 300 }),
    );
    expect(model.total).toBe(1149);
    expect(model.grandTotal).toBe(1449);
    expect(model.rows.some((r) => r.negative)).toBe(true);
  });

  it("labels payment states honestly", () => {
    expect(paymentSummary({ paymentStatus: "PAID" }).label).toBe("Paid");
    expect(paymentSummary({ paymentStatus: "PENDING" }).label).toBe(
      "Payment pending",
    );
    expect(
      paymentSummary({
        paymentStatus: "PENDING",
        paymentDetails: { status: "FAILED" },
      }).label,
    ).toBe("Payment failed");
  });
});

describe("BookingDetails page", () => {
  it("shows the booking sections from the API", async () => {
    getBookingDetail.mockResolvedValue(detail());
    renderPage();
    expect(
      await screen.findByRole("heading", { level: 3, name: "Deep Cleaning" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Ramesh Sharma")).toBeInTheDocument();
    expect(screen.getByText(/12 MG Road/)).toBeInTheDocument();
    expect(screen.getByText("Price Breakdown")).toBeInTheDocument();
    expect(
      screen.getAllByRole("list", { name: "Booking progress" })[0],
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("status", { name: /Start code \d/ }),
    ).not.toBeInTheDocument();
  });

  it("shows the start code only when the server sends one", async () => {
    getBookingDetail.mockResolvedValue(
      detail({ status: "arrived", startOtp: "4821" }),
    );
    renderPage();
    expect(await screen.findByText("Start Service OTP")).toBeInTheDocument();
    expect(
      screen.getByRole("status", { name: "Start code 4 8 2 1" }),
    ).toBeInTheDocument();
  });

  it("says so when the booking isn't found (404 or someone else's)", async () => {
    getBookingDetail.mockRejectedValue({
      status: 404,
      code: "BOOKING_NOT_FOUND",
      message: "Booking not found",
    });
    renderPage();
    expect(
      await screen.findByText("We couldn't find this booking"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Back to my bookings" }),
    ).toHaveAttribute("href", "/customer/bookings");
  });

  it("lets the customer approve a pending extra charge", async () => {
    const pending = detail({
      status: "in_progress",
      extraCharges: [
        {
          _id: "x1",
          title: "Pipe fitting",
          reason: "Old pipe was leaking",
          amount: 300,
          status: "pending",
        },
      ],
    });
    const approved = {
      ...pending,
      extraCharges: [
        { ...pending.extraCharges[0], status: "approved" as const },
      ],
      extraChargesApprovedTotal: 300,
    };
    // The page re-fetches after a decision, so the server's answer changes from the second call on.
    getBookingDetail.mockResolvedValueOnce(pending).mockResolvedValue(approved);
    decideExtraCharge.mockResolvedValue(approved);
    renderPage();

    await userEvent.click(
      await screen.findByRole("button", { name: /Approve/ }),
    );
    expect(decideExtraCharge).toHaveBeenCalledWith(ID, "x1", "approve");
    expect(await screen.findByText("Approved")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Approve/ }),
    ).not.toBeInTheDocument();
  });

  it("shows the server's reason when a decision is refused", async () => {
    const pending = detail({
      status: "in_progress",
      extraCharges: [
        { _id: "x1", title: "Pipe fitting", amount: 300, status: "pending" },
      ],
    });
    getBookingDetail.mockResolvedValue(pending);
    decideExtraCharge.mockRejectedValue({
      status: 409,
      code: "EXTRA_CHARGE_ALREADY_DECIDED",
      message: "This extra charge was already approved",
    });
    renderPage();

    await userEvent.click(
      await screen.findByRole("button", { name: "Reject" }),
    );
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent("already approved"),
    );
  });

  it("does not offer decisions while the partner isn't on site", async () => {
    getBookingDetail.mockResolvedValue(
      detail({
        status: "assigned",
        extraCharges: [
          { _id: "x1", title: "Pipe fitting", amount: 300, status: "pending" },
        ],
      }),
    );
    renderPage();
    expect(await screen.findByText("Pipe fitting")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Approve/ }),
    ).not.toBeInTheDocument();
  });
});
