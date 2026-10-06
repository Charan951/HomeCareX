import { Skeleton } from "../Skeleton";
import { categoryGridClass } from "./CategoryGrid";

/** Same bento grid as CategoryGrid so the page doesn't jump when data arrives. */
export function CategorySkeleton({ count = 6 }: { count?: number }) {
  return (
    <div role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">Loading categories…</span>
      <ul className={categoryGridClass(false)} aria-hidden="true">
        {Array.from({ length: count }, (_, i) => (
          <li key={i}>
            <Skeleton className="h-full w-full rounded-[22px] md:rounded-[26px]" />
          </li>
        ))}
      </ul>
    </div>
  );
}
