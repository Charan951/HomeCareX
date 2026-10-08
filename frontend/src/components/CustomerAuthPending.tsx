import { BookingsPageSkeleton } from "@/pages/customer/Bookings/components/BookingListSkeleton";

const BONE = "animate-pulse rounded-md bg-slate-200";

/**
 * Shown by ProtectedRoute while the session is restored after a page refresh. It mirrors the customer
 * layout (sidebar, top bar, content), so the page appears to load in place instead of the whole
 * screen being replaced by a spinner. `pathname` picks the matching page skeleton.
 */
export default function CustomerAuthPending({
  pathname,
}: {
  pathname: string;
}) {
  const isBookings = /^\/customer\/bookings\/?$/i.test(pathname);

  return (
    <div
      className="flex min-h-screen bg-canvas"
      role="status"
      aria-live="polite"
    >
      <span className="sr-only">Checking your session...</span>
      <aside
        aria-hidden="true"
        className="hidden w-60 shrink-0 border-r border-line bg-panel p-5 md:block"
      >
        <div className={`${BONE} h-7 w-32`} />
        <div className="mt-8 space-y-4">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className={`${BONE} h-9 w-full`} />
          ))}
        </div>
      </aside>
      <div className="min-w-0 flex-1">
        <div
          aria-hidden="true"
          className="flex h-[68px] items-center border-b border-line bg-panel px-4 md:px-8"
        >
          <div className={`${BONE} h-9 w-56`} />
        </div>
        <main className="px-4 py-6 md:px-8">
          {isBookings ? (
            <BookingsPageSkeleton />
          ) : (
            <div
              aria-hidden="true"
              className="mx-auto w-full max-w-6xl space-y-4"
            >
              <div className={`${BONE} h-8 w-48`} />
              <div className={`${BONE} h-40 w-full`} />
              <div className={`${BONE} h-40 w-full`} />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
