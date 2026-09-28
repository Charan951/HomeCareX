/**
 * Customer routes are mounted at /customer/* in AppRoutes, so every link or
 * navigate() call inside the customer dashboard must include that prefix.
 * Use customerPath("/bookings") instead of hardcoding "/bookings" — that would
 * point at the root of the app (where no such route exists) and appear as
 * "the page doesn't navigate".
 */
export const CUSTOMER_BASE = "/customer";

export const customerPath = (path = ""): string =>
  path === "" || path === "/" ? CUSTOMER_BASE : `${CUSTOMER_BASE}${path}`;
