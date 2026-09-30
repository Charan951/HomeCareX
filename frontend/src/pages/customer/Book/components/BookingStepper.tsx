import { useEffect, useRef } from "react";

const STEP_TITLES = ["Service Details", "Address", "Date & Time", "Review & Pay"] as const;

/** Progress bar + step heading. Moves focus to the heading on every step change so screen-reader
 *  and keyboard users land somewhere meaningful instead of at the top of a long page. */
export default function BookingStepper({ currentStep }: { currentStep: number }) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const isInitialMount = useRef(true);

  useEffect(() => {
    // Skip focus on the initial page load/refresh
    if (isInitialMount.current) {
      isInitialMount.current = false;
    } else {
      // Only focus when actually transitioning between steps
      headingRef.current?.focus();
    }
  }, [currentStep]);

  return (
    <div className="mb-6 w-full">
      <h2
        ref={headingRef}
        tabIndex={-1}
        // Removed focus-visible:ring-2 to prevent the blue outline
        className="mb-3 rounded text-lg font-semibold text-ink outline-none focus:outline-none focus:ring-0"
      >
        Step {currentStep} of 4: {STEP_TITLES[currentStep - 1]}
      </h2>
      <div className="flex gap-2" role="progressbar" aria-valuenow={currentStep} aria-valuemin={1} aria-valuemax={4}>
        {[1, 2, 3, 4].map((step) => (
          <div key={step} className={`h-1.5 flex-1 rounded-full transition-colors ${currentStep >= step ? "bg-brand" : "bg-line"}`} />
        ))}
      </div>
    </div>
  );
}