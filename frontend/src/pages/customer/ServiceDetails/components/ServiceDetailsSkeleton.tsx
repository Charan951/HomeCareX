import { Skeleton } from "@/components/customer/Skeleton";

/** Same grid as the real page, so nothing jumps when the data arrives. */
export default function ServiceDetailsSkeleton() {
  return (
    <div role="status" aria-label="Loading service details" className="mx-auto max-w-[1280px]">
      <Skeleton className="h-5 w-64 max-w-full" />
      <div className="mt-4 grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px] xl:gap-8">
        <div className="xl:col-start-1 xl:row-start-1">
          <Skeleton className="aspect-[16/11] w-full rounded-[28px] md:aspect-[16/9] md:max-h-[calc(100svh-17.5rem)] md:min-h-[260px] xl:aspect-[9/5]" />
          <div className="mt-3 flex gap-2.5">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-14 w-[72px] shrink-0 rounded-xl md:h-16 md:w-24" />
            ))}
          </div>
        </div>
        <div className="space-y-4 rounded-3xl border border-line bg-panel p-4 xl:col-start-2 xl:row-span-2 xl:row-start-1 xl:self-start md:p-5">
          <Skeleton className="h-7 w-28 rounded-full" />
          <Skeleton className="h-7 w-4/5" />
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-16 rounded-2xl" />
          <Skeleton className="h-14 rounded-2xl" />
          <Skeleton className="h-[46px] rounded-full" />
        </div>
        <div className="min-w-0 space-y-5 xl:col-start-1 xl:row-start-2">
          <Skeleton className="h-12 rounded-full" />
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-24" />
          <Skeleton className="h-48 rounded-3xl" />
          <Skeleton className="h-40 rounded-3xl" />
        </div>
      </div>
    </div>
  );
}
