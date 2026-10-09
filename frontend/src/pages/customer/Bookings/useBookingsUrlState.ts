import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import type { BookingSort, BookingTab } from "@/types/bookingList";
import { DEFAULT_SORT, STATUS_OPTIONS, isSort, isTab } from "./bookingTabs";

export interface BookingsUrlState {
  tab: BookingTab;
  /** Narrows the tab to one status. Always one of that tab's own options. */
  status: string;
  search: string;
  date: string;
  service: string;
  /** The sort in effect: the URL's, or the tab's default. */
  sort: BookingSort;
  /** True when the URL carries a sort of its own. */
  customSort: boolean;
  page: number;
}

type Patch = Partial<Omit<BookingsUrlState, "customSort">>;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Reads the URL defensively: a hand-edited or stale link falls back to defaults instead of breaking. */
export function parseBookingsParams(params: URLSearchParams): BookingsUrlState {
  const rawTab = params.get("tab");
  const tab: BookingTab = isTab(rawTab) ? rawTab : "upcoming";

  const rawStatus = params.get("status") ?? "";
  const status = STATUS_OPTIONS[tab].some((o) => o.value === rawStatus) ? rawStatus : "";

  const rawDate = params.get("date") ?? "";
  const rawSort = params.get("sort");
  const rawPage = Number(params.get("page"));

  return {
    tab,
    status,
    search: (params.get("q") ?? "").slice(0, 60),
    date: DATE_RE.test(rawDate) ? rawDate : "",
    service: (params.get("service") ?? "").slice(0, 100),
    sort: isSort(rawSort) ? rawSort : DEFAULT_SORT[tab],
    customSort: isSort(rawSort),
    page: Number.isInteger(rawPage) && rawPage >= 1 ? rawPage : 1,
  };
}

/** Tab, filters, search and page live in the URL, so refresh, back and shared links all keep the view. */
export function useBookingsUrlState() {
  const [searchParams, setSearchParams] = useSearchParams();
  const state = useMemo(() => parseBookingsParams(searchParams), [searchParams]);

  const update = useCallback(
    (patch: Patch, opts: { replace?: boolean } = {}) => {
      const current = parseBookingsParams(searchParams);
      const next: BookingsUrlState = { ...current, ...patch };
      // Anything but a plain page change starts again from page 1.
      if (patch.page === undefined) next.page = 1;

      const params = new URLSearchParams();
      if (next.tab !== "upcoming") params.set("tab", next.tab);
      if (next.status) params.set("status", next.status);
      if (next.search) params.set("q", next.search);
      if (next.date) params.set("date", next.date);
      if (next.service) params.set("service", next.service);
      const sortChanged = patch.sort !== undefined || current.customSort;
      if (sortChanged && next.sort !== DEFAULT_SORT[next.tab]) params.set("sort", next.sort);
      if (next.page > 1) params.set("page", String(next.page));

      setSearchParams(params, { replace: opts.replace ?? false });
    },
    [searchParams, setSearchParams],
  );

  const setTab = useCallback(
    // A status from the old tab means nothing in the new one, and so does a hand-picked sort.
    (tab: BookingTab) => update({ tab, status: "", sort: DEFAULT_SORT[tab] }),
    [update],
  );
  const setSearch = useCallback((search: string) => update({ search }, { replace: true }), [update]);
  const setFilters = useCallback(
    (patch: Pick<Patch, "status" | "date" | "service" | "sort">) => update(patch, { replace: true }),
    [update],
  );
  const setPage = useCallback(
    (page: number, replace = false) => update({ page }, { replace }),
    [update],
  );
  const clearFilters = useCallback(
    () => update({ status: "", search: "", date: "", service: "", sort: DEFAULT_SORT[state.tab] }, { replace: true }),
    [update, state.tab],
  );

  const hasFilters = Boolean(state.status || state.search || state.date || state.service);

  return { state, hasFilters, setTab, setSearch, setFilters, setPage, clearFilters };
}