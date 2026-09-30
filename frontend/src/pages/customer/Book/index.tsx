import { useEffect } from "react";
import { useParams, useSearchParams, Navigate } from "react-router-dom";
import { useBookingDraftStore } from "@/features/booking";
import BookingStepper from "./components/BookingStepper";
import StepService from "./StepService";
import StepAddress from "./StepAddress";
import StepSlot from "./StepSlot";
import StepReview from "./StepReview";

export default function BookServiceShell() {
  const { serviceSlug } = useParams<{ serviceSlug: string }>();
  const [searchParams] = useSearchParams();
  const requestedStep = Number(searchParams.get("step") || "1");
  const { currentStep, setStep, getFirstIncompleteStep } = useBookingDraftStore();

  // ?step=4 with an incomplete draft bounces to the first step that still needs filling in.
  useEffect(() => {
    const firstIncomplete = getFirstIncompleteStep();
    if (requestedStep > firstIncomplete) setStep(firstIncomplete);
    else if (requestedStep >= 1 && requestedStep <= 4 && requestedStep !== currentStep && requestedStep <= firstIncomplete)
      setStep(requestedStep);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-run when the URL's ?step= changes
  }, [requestedStep]);

  if (!serviceSlug) return <Navigate to="/customer/services" replace />;

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-6 sm:px-0">
      <div>
        <h1 className="text-xl font-semibold text-ink">Book a Service</h1>
        <p className="mt-1 text-sm text-muted">Complete the steps below to confirm your booking.</p>
      </div>
      <BookingStepper currentStep={currentStep} />
      <div className="rounded border border-line bg-panel p-4 sm:p-6">
        {currentStep === 1 && <StepService serviceSlug={serviceSlug} />}
        {currentStep === 2 && <StepAddress />}
        {currentStep === 3 && <StepSlot />}
        {currentStep === 4 && <StepReview />}
      </div>
    </div>
  );
}
