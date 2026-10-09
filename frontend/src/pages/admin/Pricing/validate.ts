import type { PricingFormErrors, PricingFormValues, PricingRuleInput, PricingScope } from "@/types/adminPricing";

const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3));
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

function whole(raw: string, label: string, errors: PricingFormErrors, key: string, min = 0): number {
  if (raw.trim() === "") {
    errors[key] = `${label} is required`;
    return 0;
  }
  const n = Number(raw);
  if (!Number.isFinite(n)) errors[key] = `${label} must be a number`;
  else if (n < min) errors[key] = min === 0 ? `${label} cannot be negative` : `${label} must be at least ${min}`;
  else if (!Number.isInteger(n)) errors[key] = `${label} must be a whole number`;
  return n;
}

/** Mirrors the server rules so mistakes show before the request. The server still has the final say. */
export function validatePricing(
  scope: PricingScope,
  v: PricingFormValues,
): { errors: PricingFormErrors; input: PricingRuleInput | null } {
  const errors: PricingFormErrors = {};
  if (!scope.categoryId) errors.categoryId = "Select a category";
  const basePrice = whole(v.basePrice, "Base price", errors, "basePrice");
  const durationMinutes = whole(v.durationMinutes, "Duration", errors, "durationMinutes", 5);
  const cancellationFee = whole(v.cancellationFee, "Cancellation fee", errors, "cancellationFee");

  const addOns = v.addOns.map((a, i) => {
    if (!a.name.trim()) errors[`addOns.${i}.name`] = "Name is required";
    return { name: a.name.trim(), price: whole(a.price, "Price", errors, `addOns.${i}.price`) };
  });

  const surgeWindows = v.surgeWindows.map((w, i) => {
    if (!w.label.trim()) errors[`surgeWindows.${i}.label`] = "Label is required";
    if (!TIME.test(w.startTime)) errors[`surgeWindows.${i}.startTime`] = "Pick a start time";
    if (!TIME.test(w.endTime)) errors[`surgeWindows.${i}.endTime`] = "Pick an end time";
    if (TIME.test(w.startTime) && TIME.test(w.endTime) && toMin(w.startTime) >= toMin(w.endTime)) {
      errors[`surgeWindows.${i}.endTime`] = "End must be after start";
    }
    const percent = Number(w.percent);
    if (w.percent.trim() === "" || !Number.isFinite(percent)) errors[`surgeWindows.${i}.percent`] = "Enter a percent";
    else if (percent < 0) errors[`surgeWindows.${i}.percent`] = "Cannot be negative";
    else if (percent > 200) errors[`surgeWindows.${i}.percent`] = "Max 200%";
    return { label: w.label.trim(), startTime: w.startTime, endTime: w.endTime, percent };
  });

  const ok = surgeWindows
    .map((w, i) => ({ i, s: toMin(w.startTime), e: toMin(w.endTime) }))
    .filter(({ i }) => !errors[`surgeWindows.${i}.startTime`] && !errors[`surgeWindows.${i}.endTime`])
    .sort((a, b) => a.s - b.s);
  for (let k = 1; k < ok.length; k++) {
    if (ok[k].s < ok[k - 1].e) errors[`surgeWindows.${ok[k].i}.startTime`] = "Overlaps another window";
  }

  if (Object.keys(errors).length > 0) return { errors, input: null };
  return {
    errors,
    input: { ...scope, mode: v.mode, basePrice, durationMinutes, cancellationFee, addOns, surgeWindows, active: v.active },
  };
}
