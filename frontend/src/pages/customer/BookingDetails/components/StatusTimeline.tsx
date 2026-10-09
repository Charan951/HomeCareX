import clsx from "clsx";
import { Car, Check, Home, Search, Settings, User, X } from "lucide-react";
import type { ComponentType } from "react";
import { formatMoment, type TimelineItem } from "../bookingDetailModel";

const STATE_TEXT: Record<TimelineItem["state"], string> = {
  done: "Done",
  current: "Current step",
  upcoming: "Upcoming",
  failed: "Stopped",
};

const ICONS: Record<string, ComponentType<{ className?: string }>> = {
  confirmed: Check,
  searching: Search,
  assigned: User,
  en_route: Car,
  arrived: Home,
  in_progress: Settings,
  completed: Check,
};

function Dot({ item }: { item: TimelineItem }) {
  const Icon = ICONS[item.key] ?? Check;
  return (
    <span
      aria-hidden="true"
      className={clsx(
        "relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2",
        item.state === "done" && "border-brand bg-brand text-white",
        item.state === "current" &&
          "border-brand bg-panel text-brand shadow-[0_0_0_4px_rgba(82,71,210,0.12)]",
        item.state === "upcoming" &&
          "border-transparent bg-slate-100 text-slate-400",
        item.state === "failed" && "border-danger bg-danger text-white",
      )}
    >
      {item.state === "done" && <Check className="h-4 w-4" />}
      {item.state === "failed" && <X className="h-4 w-4" />}
      {(item.state === "current" || item.state === "upcoming") && (
        <Icon className="h-4 w-4" />
      )}
    </span>
  );
}

function Label({
  item,
  align,
}: {
  item: TimelineItem;
  align: "center" | "left";
}) {
  const when = formatMoment(item.at);
  return (
    <div className={clsx("min-w-0", align === "center" && "text-center")}>
      <p
        className={clsx(
          "break-words text-xs leading-tight",
          item.state === "upcoming" ? "text-muted" : "font-semibold text-ink",
          item.state === "failed" && "text-danger",
        )}
      >
        {item.label}
        <span className="sr-only"> — {STATE_TEXT[item.state]}</span>
      </p>
      {when && <p className="mt-0.5 text-[11px] text-muted">{when}</p>}
    </div>
  );
}

/** Horizontal stepper on wide screens, a vertical list on phones. The current step is announced to screen readers. */
export default function StatusTimeline({ items }: { items: TimelineItem[] }) {
  return (
    <>
      {/* Wide screens */}
      <ol aria-label="Booking progress" className="hidden md:flex">
        {items.map((item, i) => (
          <li
            key={item.key}
            aria-current={item.state === "current" ? "step" : undefined}
            className="relative flex min-w-0 flex-1 flex-col items-center gap-2 px-1"
          >
            {i > 0 && (
              <span
                aria-hidden="true"
                className={clsx(
                  "absolute right-1/2 top-[18px] h-0.5 w-full",
                  items[i - 1].state === "done" && item.state !== "upcoming"
                    ? "bg-brand"
                    : "border-t-2 border-dashed border-line",
                )}
              />
            )}
            <Dot item={item} />
            <Label item={item} align="center" />
          </li>
        ))}
      </ol>

      {/* Phones */}
      <ol aria-label="Booking progress" className="md:hidden">
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <li
              key={item.key}
              aria-current={item.state === "current" ? "step" : undefined}
              className="relative flex gap-3 pb-5 last:pb-0"
            >
              {!last && (
                <span
                  aria-hidden="true"
                  className={clsx(
                    "absolute left-[17px] top-9 h-[calc(100%-2.25rem)] w-0.5",
                    item.state === "done" ? "bg-brand" : "bg-line",
                  )}
                />
              )}
              <Dot item={item} />
              <div className="pt-1.5">
                <Label item={item} align="left" />
              </div>
            </li>
          );
        })}
      </ol>
    </>
  );
}
