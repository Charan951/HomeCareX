import "@testing-library/jest-dom/vitest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, useLocation } from "react-router-dom";
import type { BookingListItem } from "../pages/customer/Bookings/bookingModel";
import { parseBookingsParams } from "../pages/customer/Bookings/useBookingsUrlState";
import type { BookingPage } from "../types/bookingList";

const listBookings = vi.fn();

vi.mock("@/services/bookingApi", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/services/bookingApi")>();
  return {
    ...actual,
    bookingApi: {
      ...actual.bookingApi,
      listBookings: (...a: unknown[]) => listBookings(...a),
    },
  };
});

import MyBookingsPage from "../pages/customer/Bookings";

/* ------------------------------ fixtures ------------------------------ */

const ID = "65f0c0ffee00000000a1b2c3";

const booking = (over: Partial<BookingListItem> = {}): BookingListItem =>
  ({
    _id: ID,
    status: "confirmed",
    paymentStatus: "paid",
    date: "2026-10-12",
    slot: "10:00-12:00",
    serviceName: "AC Service",
    partnerId: { name: "Ramesh Kumar", rating: 4.8 },
    priceSnapshot: {
      total: 1499,
      lines: [{ kind: "BASE", name: "AC Service", amount: 1499 }],
    },
    ...over,
  }) as unknown as BookingListItem;

const page = (
  items: BookingListItem[],
  meta: Partial<BookingPage["meta"]> = {},
): BookingPage => ({
  items,
  meta: {
    page: 1,
    limit: 10,
    total: items.length,
    totalPages: items.length ? 1 : 0,
    ...meta,
  },
});

const LocationDisplay = () => (
  <div data-testid="search">{useLocation().search}</div>
);

const renderPage = (entry = "/customer/bookings") => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[entry]}>
        <MyBookingsPage />
        <LocationDisplay />
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

const lastParams = () =>
  listBookings.mock.calls.at(-1)?.[0] as Record<string, unknown>;

let online = true;
beforeEach(() => {
  listBookings.mockReset();
  online = true;
  vi.spyOn(window.navigator, "onLine", "get").mockImplementation(() => online);
});
afterEach(() => vi.restoreAllMocks());

/* -------------------------------- tests -------------------------------- */

describe("My Bookings page", () => {
  it("shows every field on the card, with View Details and Track", async () => {
    listBookings.mockResolvedValue(page([booking()]));
    renderPage();

    const card = await screen.findByRole("article", { name: "AC Service" });
    const c = within(card);
    expect(
      c.getByText("BK-A1B2C3".slice(0, 3) + ID.slice(-5).toUpperCase()),
    ).toBeInTheDocument();
    expect(c.getByText("12 Oct")).toBeInTheDocument();
    expect(c.getByText("10 AM – 12 PM")).toBeInTheDocument();
    expect(c.getByText("₹1,499")).toBeInTheDocument();
    expect(c.getByText(/Ramesh Kumar/)).toBeInTheDocument();
    expect(c.getByText("Confirmed")).toBeInTheDocument();
    expect(c.getByRole("link", { name: /View Details/ })).toHaveAttribute(
      "href",
      expect.stringContaining(`/bookings/${ID}`),
    );
    expect(c.getByRole("link", { name: /Track/ })).toHaveAttribute(
      "href",
      expect.stringContaining(`booking=${ID}`),
    );
  });

  it("falls back to legacy pricing fields when priceSnapshot is missing", async () => {
    listBookings.mockResolvedValue(
      page([
        booking({
          priceSnapshot: undefined,
          priceBreakdown: { total: 1799, subtotal: 1799, lines: [] },
        } as Partial<BookingListItem>),
      ]),
    );

    renderPage();

    expect(await screen.findByText("₹1,799")).toBeInTheDocument();
  });

  it("asks the server for the Upcoming tab, page 1, ten per page, soonest first", async () => {
    listBookings.mockResolvedValue(page([booking()]));
    renderPage();
    await screen.findByRole("article");
    expect(lastParams()).toMatchObject({
      status: "upcoming",
      page: 1,
      limit: 10,
      sort: "date_asc",
    });
  });

  it("switches tabs and re-queries with that tab", async () => {
    listBookings.mockResolvedValue(page([booking()]));
    const user = userEvent.setup();
    renderPage();
    await screen.findByRole("article");

    await user.click(screen.getByRole("tab", { name: "Completed" }));
    await waitFor(() =>
      expect(lastParams()).toMatchObject({
        status: "completed",
        sort: "date_desc",
      }),
    );
    expect(screen.getByTestId("search")).toHaveTextContent("tab=completed");
    expect(screen.getByRole("tab", { name: "Completed" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("moves between tabs with the arrow keys", async () => {
    listBookings.mockResolvedValue(page([booking()]));
    const user = userEvent.setup();
    renderPage();
    await screen.findByRole("article");

    screen.getByRole("tab", { name: "Upcoming" }).focus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Live" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("tab", { name: "Live" })).toHaveFocus();
    await user.keyboard("{End}");
    expect(screen.getByRole("tab", { name: "Cancelled" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("offers Track on live bookings but Book again on completed ones", async () => {
    const user = userEvent.setup();
    listBookings.mockResolvedValue(page([booking({ status: "completed" })]));
    renderPage("/customer/bookings?tab=completed");

    const card = await screen.findByRole("article");
    expect(
      within(card).queryByRole("link", { name: /Track/ }),
    ).not.toBeInTheDocument();
    expect(
      within(card).getByRole("link", { name: /Book again/ }),
    ).toBeInTheDocument();

    listBookings.mockResolvedValue(page([booking({ status: "en_route" })]));
    await user.click(screen.getByRole("tab", { name: "Live" }));
    await waitFor(() =>
      expect(screen.getByRole("link", { name: /Track/ })).toBeInTheDocument(),
    );
  });

  it("paginates: Next asks the server for page 2", async () => {
    const user = userEvent.setup();
    listBookings.mockResolvedValue(
      page([booking()], { total: 25, totalPages: 3 }),
    );
    renderPage();
    await screen.findByRole("article");
    expect(screen.getByText("Showing 1–1 of 25 bookings")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Next page" }));
    await waitFor(() => expect(lastParams()).toMatchObject({ page: 2 }));
    expect(screen.getByTestId("search")).toHaveTextContent("page=2");
  });

  it("goes back to page 1 when a filter changes", async () => {
    const user = userEvent.setup();
    listBookings.mockResolvedValue(
      page([booking()], { page: 3, total: 30, totalPages: 3 }),
    );
    renderPage("/customer/bookings?page=3");
    await screen.findByRole("article");

    await user.selectOptions(screen.getByLabelText("Status"), "assigned");
    await waitFor(() =>
      expect(lastParams()).toMatchObject({ status: "assigned", page: 1 }),
    );
    expect(screen.getByTestId("search")).not.toHaveTextContent("page=");
  });

  it("sends the search text and shows a no-match state with a working Clear filters", async () => {
    const user = userEvent.setup();
    listBookings.mockImplementation(async (p: { search?: string }) =>
      p.search ? page([]) : page([booking()]),
    );
    renderPage();
    await screen.findByRole("article");

    await user.type(
      screen.getByRole("searchbox", { name: /search bookings/i }),
      "zzz{Enter}",
    );
    expect(
      await screen.findByText("No bookings match your filters"),
    ).toBeInTheDocument();
    expect(lastParams()).toMatchObject({ search: "zzz" });

    await user.click(
      screen.getAllByRole("button", { name: "Clear filters" })[0],
    );
    expect(await screen.findByRole("article")).toBeInTheDocument();
    expect(
      screen.getByRole("searchbox", { name: /search bookings/i }),
    ).toHaveValue("");
    expect(screen.getByTestId("search")).not.toHaveTextContent("q=");
  });

  it("does not bring back cleared search text when its pause-timer fires late", async () => {
    const user = userEvent.setup();
    listBookings.mockResolvedValue(page([booking()]));
    renderPage();
    await screen.findByRole("article");

    await user.type(
      screen.getByRole("searchbox", { name: /search bookings/i }),
      "abc",
    );
    await user.click(screen.getByRole("button", { name: "Clear search" })); // well inside the 350ms pause
    await new Promise((r) => setTimeout(r, 500)); // let any stale timer fire

    expect(screen.getByTestId("search")).not.toHaveTextContent("q=");
    expect(
      listBookings.mock.calls.some(
        ([p]) => (p as { search?: string }).search === "abc",
      ),
    ).toBe(false);
  });

  it("shows a skeleton while loading", () => {
    listBookings.mockReturnValue(new Promise(() => undefined));
    renderPage();
    expect(
      screen.getByRole("status", { name: /loading your bookings/i }),
    ).toBeInTheDocument();
  });

  it("shows the empty state for a tab with nothing in it", async () => {
    listBookings.mockResolvedValue(page([]));
    renderPage();
    expect(await screen.findByText("No upcoming bookings")).toBeInTheDocument();
  });

  it("shows an error state with Try again, then recovers", async () => {
    const user = userEvent.setup();
    listBookings.mockRejectedValueOnce({
      status: 400,
      code: "VALIDATION_ERROR",
      message: "Request validation failed",
    });
    renderPage();
    expect(
      await screen.findByText("Couldn't load bookings"),
    ).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Request validation failed",
    );

    listBookings.mockResolvedValue(page([booking()]));
    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByRole("article")).toBeInTheDocument();
  });

  it("shows the offline state instead of an endless skeleton", () => {
    online = false;
    listBookings.mockReturnValue(new Promise(() => undefined));
    renderPage();
    expect(screen.getByText("You're offline")).toBeInTheDocument();
  });
});

describe("parseBookingsParams", () => {
  const parse = (qs: string) => parseBookingsParams(new URLSearchParams(qs));

  it("defaults to Upcoming, page 1, soonest first", () => {
    expect(parse("")).toMatchObject({
      tab: "upcoming",
      page: 1,
      sort: "date_asc",
      status: "",
      customSort: false,
    });
  });

  it("ignores junk instead of breaking", () => {
    expect(
      parse("tab=nope&page=-4&date=tomorrow&sort=random&status=nope"),
    ).toMatchObject({
      tab: "upcoming",
      page: 1,
      date: "",
      sort: "date_asc",
      status: "",
    });
    expect(parse("page=2.5").page).toBe(1);
  });

  it("drops a status that does not belong to the tab", () => {
    expect(parse("tab=live&status=completed,rated").status).toBe("");
    expect(parse("tab=live&status=en_route").status).toBe("en_route");
  });

  it("uses each tab's own default sort", () => {
    expect(parse("tab=completed").sort).toBe("date_desc");
    expect(parse("tab=completed&sort=amount_asc")).toMatchObject({
      sort: "amount_asc",
      customSort: true,
    });
  });
});
