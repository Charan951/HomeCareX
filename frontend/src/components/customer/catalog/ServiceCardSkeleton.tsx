import { Skeleton } from "../Skeleton";

export function ServiceCardSkeleton() {
  return (
    <div className="flex h-full gap-3 rounded-[20px] border border-line bg-panel p-2.5 sm:flex-col sm:p-3" aria-hidden="true">
      <Skeleton className="h-[76px] w-[76px] shrink-0 rounded-2xl sm:h-28 sm:w-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-3 w-1/3" />
        <div className="flex items-center justify-between pt-2">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-7 w-16 rounded-full" />
        </div>
      </div>
    </div>
  );
}
