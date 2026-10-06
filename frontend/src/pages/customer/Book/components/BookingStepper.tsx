import { useEffect, useRef } from "react";

const STEP_TITLES = ["Service Details", "Address", "Date & Time", "Review & Pay"] as const;

/** Progress bar + step heading. Moves focus to the heading on every step change so screen-reader
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
    <div className={`w-full ${compact ? "mb-0" : "mb-6"}`}>
      <h2
        ref={headingRef}
        tabIndex={-1}
        className={`rounded text-lg font-semibold text-ink outline-none focus:outline-none focus:ring-0 ${
          compact ? "mb-2" : "mb-3"
        }`}
      >
        Step {currentStep} of 4: {STEP_TITLES[currentStep - 1]}
      </h2>

      <div
        className="flex gap-2"
        role="progressbar"
        aria-valuenow={currentStep}
        aria-valuemin={1}
        aria-valuemax={4}
      >
        {[1, 2, 3, 4].map((step) => (
          <div
            key={step}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              currentStep >= step ? "bg-brand" : "bg-line"
            }`}
          />
        ))}
      </div>
    </div>
  );
}