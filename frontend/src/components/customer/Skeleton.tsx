import clsx from "clsx";

/** Base pulsing placeholder block. Compose these into skeletons shaped like the real content. */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={clsx("animate-pulse rounded bg-line/70", className)} />;
}
