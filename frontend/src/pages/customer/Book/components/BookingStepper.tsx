import { useEffect, useRef } from "react";
import { Check } from "lucide-react";
import clsx from "clsx";

const STEP_TITLES = ["Service Details", "Address", "Date & Time", "Review & Pay"] as const;

/** Numbered progress trail + step heading. Moves focus to the heading on every step change so screen-reader
 *  and keyboard users land somewhere meaningful instead of at the top of a long page. */
interface BookingStepperProps {
  currentStep: number;
  /** Focus the heading on first render too (used when the step guard redirected the customer). */
  focusOnMount?: boolean;
  /** Tighter vertical spacing (Step 4 fits on one screen). */
  compact?: boolean;
}

export default function BookingStepper({ currentStep, focusOnMount = false, compact = false }: BookingStepperProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const isInitialMount = useRef(true);

  useEffect(() => {
    // On a plain page load/refresh don't steal focus; on step changes (and guard redirects) do.
    if (isInitialMount.current) {
      isInitialMount.current = false;
      if (!focusOnMount) return;
    }
    headingRef.current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- focusOnMount only matters on the first run
  }, [currentStep]);

  return (
    <div className="w-full">
      <h2
        ref={headingRef}
        tabIndex={-1}
        className={clsx("rounded text-base font-semibold text-ink outline-none focus:outline-none focus:ring-0", compact ? "mb-2" : "mb-4")}
      >
        Step {currentStep} of 4: {STEP_TITLES[currentStep - 1]}
      </h2>
      <ol aria-label="Booking progress" className="flex">
        {STEP_TITLES.map((title, i) => {
          const n = i + 1;
          const done = currentStep > n;
          const current = currentStep === n;
          return (
            <li key={title} aria-current={current ? "step" : undefined} className="relative flex flex-1 flex-col items-center gap-1.5 text-center">
              {n < STEP_TITLES.length && (
                <span aria-hidden="true" className="absolute left-[calc(50%+24px)] right-[calc(-50%+24px)] top-[17px] h-0.5 rounded-full bg-line">
                  <span className="block h-full rounded-full bg-brand transition-[width] duration-500 ease-out motion-reduce:transition-none" style={{ width: done ? "100%" : "0%" }} />
                </span>
              )}
              <span
                className={clsx(
                  "relative z-10 flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition-all duration-300 motion-reduce:transition-none",
                  done && "bg-brand text-white",
                  current && "bg-white text-brand ring-2 ring-brand shadow-[0_0_0_6px_rgba(67,56,202,.12)]",
                  !done && !current && "bg-line/70 text-muted",
                )}
              >
                {done ? <Check className="h-4 w-4" strokeWidth={3} aria-hidden="true" /> : n}
              </span>
              <span className={clsx("px-0.5 text-[11px] font-semibold leading-tight sm:text-xs", current ? "text-ink" : "text-muted")}>
                <span className="sr-only">{done ? "Completed: " : current ? "Current: " : "Upcoming: "}</span>
                {title}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
