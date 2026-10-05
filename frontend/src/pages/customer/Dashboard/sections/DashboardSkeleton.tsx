import { Skeleton } from "@/components/customer/Skeleton";

/** Placeholder shaped like the real Dashboard, shown while GET /customer/dashboard is in flight. */
export default function DashboardSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-busy="true">
      <span className="sr-only">Loading your dashboard…</span>
      <div className="space-y-3 rounded-lg border border-line bg-panel p-5">
        <Skeleton className="h-6 w-56" />
        <Skeleton className="h-4 w-64" />
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-10 w-full" />
      </div>

      <div className="space-y-3 rounded-lg border border-line bg-panel p-5">
        <Skeleton className="h-5 w-36" />
        {Array.from({ length: 2 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded" />
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded" />
        ))}
      </div>

      <div className="space-y-3 rounded-lg border border-line bg-panel p-5">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-12 w-full rounded" />
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded" />
        ))}
      </div>

      <div className="space-y-3">
        <Skeleton className="h-5 w-40" />
        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-48 shrink-0 rounded" />
          ))}
        </div>
      </div>
    </div>
  );
}
