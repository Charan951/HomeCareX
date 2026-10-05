/** Whole rupees, e.g. 1499 -> "₹1,499". Display only; the client never does price arithmetic. */
export function formatINR(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}