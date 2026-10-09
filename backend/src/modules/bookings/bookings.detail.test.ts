import assert from "node:assert/strict";
import { test } from "node:test";
import { buildDetailView } from "./bookings.detail";

const base = () => ({
  _id: "b1",
  customerId: "c1",
  status: "arrived",
  serviceName: "Deep Cleaning",
  partnerEarning: 640,
  offers: [{ partnerId: "p9", response: "rejected" }],
  otpCodes: { start: "4821", end: "9999" },
  idempotencyKey: "k",
  requestHash: "h",
  slotSeat: 1,
  __v: 3,
  partnerId: {
    _id: "p1",
    ratingAvg: 4.7,
    ratingCount: 31,
    userId: { name: "Ramesh Sharma", phone: "+919876543210" },
  },
  extraCharges: [
    { _id: "x1", title: "Pipe fitting", amount: 300, status: "approved" },
    { _id: "x2", title: "Extra hour", amount: 450.5, status: "pending" },
    { _id: "x3", title: "Paint", amount: 999, status: "rejected" },
  ],
});

test("internal fields never reach the customer", () => {
  const view = buildDetailView(base(), "4821");
  for (const key of [
    "partnerEarning",
    "offers",
    "otpCodes",
    "idempotencyKey",
    "requestHash",
    "slotSeat",
    "__v",
  ]) {
    assert.equal(key in view, false, `${key} leaked`);
  }
  assert.equal(JSON.stringify(view).includes("9999"), false, "end OTP leaked");
});

test("start OTP is shown only while the partner has arrived", () => {
  assert.equal(buildDetailView(base(), "4821").startOtp, "4821");
  for (const status of [
    "confirmed",
    "assigned",
    "en_route",
    "in_progress",
    "completed",
    "cancelled_by_customer",
  ]) {
    assert.equal(
      buildDetailView({ ...base(), status }, "4821").startOtp,
      null,
      status,
    );
  }
  assert.equal(buildDetailView(base(), null).startOtp, null);
});

test("partner is flattened and the phone is hidden once the job is over", () => {
  const live = buildDetailView(base(), null);
  assert.deepEqual(live.partner, {
    name: "Ramesh Sharma",
    phone: "+919876543210",
    rating: 4.7,
    ratingCount: 31,
  });
  assert.equal(live.partnerId, "p1");

  const done = buildDetailView({ ...base(), status: "completed" }, null);
  assert.equal((done.partner as { phone?: string }).phone, undefined);
  assert.equal((done.partner as { name?: string }).name, "Ramesh Sharma");
});

test("no partner yet -> partner null, no partnerId", () => {
  const view = buildDetailView(
    { ...base(), partnerId: null, status: "searching_for_partner" },
    null,
  );
  assert.equal(view.partner, null);
  assert.equal("partnerId" in view, false);
});

test("an unpopulated partner id stays an id string", () => {
  const view = buildDetailView({ ...base(), partnerId: "abc123" }, null);
  assert.equal(view.partnerId, "abc123");
  assert.equal(view.partner, null);
});

test("extra charges are listed and only approved ones are totalled", () => {
  const view = buildDetailView(base(), null);
  assert.equal((view.extraCharges as unknown[]).length, 3);
  assert.equal(view.extraChargesApprovedTotal, 300);
  const pendingOnly = buildDetailView(
    {
      ...base(),
      extraCharges: [
        { _id: "x", title: "t", amount: 10.255, status: "approved" },
      ],
    },
    null,
  );
  assert.equal(pendingOnly.extraChargesApprovedTotal, 10.26);
});

test("a booking with no extra charges gets an empty list and zero total", () => {
  const { extraCharges: _drop, ...rest } = base();
  void _drop;
  const view = buildDetailView(rest, null);
  assert.deepEqual(view.extraCharges, []);
  assert.equal(view.extraChargesApprovedTotal, 0);
});

test("a completed booking is shown as PAID even with no payment record", () => {
  for (const status of ["completed", "rated"]) {
    const view = buildDetailView(
      { ...base(), status, paymentStatus: "PENDING" },
      null,
    );
    assert.equal(view.paymentStatus, "PAID", status);
  }
});

test("a booking that is not completed stays pending, and failed/refunded are never overridden", () => {
  assert.equal(
    buildDetailView(
      { ...base(), status: "in_progress", paymentStatus: "PENDING" },
      null,
    ).paymentStatus,
    "PENDING",
  );
  assert.equal(
    buildDetailView(
      { ...base(), status: "completed", paymentStatus: "REFUNDED" },
      null,
    ).paymentStatus,
    "REFUNDED",
  );
  assert.equal(
    buildDetailView(
      { ...base(), status: "completed", paymentStatus: "PENDING" },
      null,
      { payment: { status: "FAILED" } },
    ).paymentStatus,
    "PENDING",
  );
});
