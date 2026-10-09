import clsx from "clsx";

/**
 * Placeholder block. Deliberately a touch darker than the shared Skeleton: on a white card the
 * shared one is close to invisible, and a loading state nobody can see reads as a blank page.
 */
function Bone({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={clsx(
        "animate-pulse bg-slate-200",
        !className?.includes("rounded") && "rounded-md",
        className,
      )}
    />
  );
}

/** Placeholder cards shaped like BookingCard, in the same grid, so the page doesn't jump when the data lands. */
export function BookingListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div role="status" aria-live="polite" aria-label="Loading your bookings">
      <span className="sr-only">Loading your bookings…</span>
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(20rem,100%),1fr))] gap-4">
        {Array.from({ length: count }, (_, i) => (
          <li
            key={i}
            className="flex overflow-hidden rounded-2xl border border-line bg-panel shadow-[0_6px_20px_rgba(30,27,46,.08)]"
          >
            <div
              aria-hidden="true"
              className="w-1.5 shrink-0 animate-pulse bg-slate-300"
            />
            <div className="flex min-w-0 flex-1 flex-col gap-4 p-4">
              <div className="flex items-start gap-3">
                <Bone className="h-16 w-16 shrink-0 rounded-2xl" />
                <div className="min-w-0 flex-1 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <Bone className="h-6 w-24 rounded-full" />
                    <Bone className="h-5 w-16" />
                  </div>
                  <Bone className="h-5 w-3/4" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 rounded-xl bg-canvas p-3">
                {Array.from({ length: 4 }, (_, j) => (
                  <div key={j} className="space-y-2">
                    <Bone className="h-3 w-12" />
                    <Bone className="h-4 w-20" />
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Bone className="h-11 flex-1 rounded-xl" />
                <Bone className="h-11 flex-1 rounded-full" />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * The whole My Bookings page as placeholders: heading, search + filter button, tabs and cards.
 * Shown while the session is being restored after a refresh, before the real page can mount.
 * Filters are collapsed by default, so there is no filter skeleton.
 */
export function BookingsPageSkeleton() {
  return (
    <div className="mx-auto w-full max-w-6xl" aria-hidden="true">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <Bone className="h-8 w-40" />
          <Bone className="h-4 w-72 max-w-full" />
        </div>
        <Bone className="h-11 w-40 rounded-full" />
      </div>
      <div className="mt-6 flex items-center gap-2">
        <Bone className="h-12 flex-1 rounded-2xl" />
        <Bone className="h-12 w-12 rounded-2xl" />
      </div>
      <div className="mt-4 flex gap-6 border-b border-line pb-3">
        {Array.from({ length: 4 }, (_, i) => (
          <Bone key={i} className="h-5 flex-1" />
        ))}
      </div>
      <div className="mt-6">
        <BookingListSkeleton />
      </div>
    </div>
  );
}
