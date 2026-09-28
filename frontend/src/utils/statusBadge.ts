/** Tailwind classes for a small status pill, keyed by status text. */
export function statusBadgeClass(status: string): string {
  switch (status) {
    case "Completed":
    case "Resolved":
      return "bg-green-50 text-green-700";
    case "Cancelled":
      return "bg-danger-soft text-danger";
    case "In Progress":
    case "En Route":
    case "Arrived":
      return "bg-accent-soft text-accent";
    case "Confirmed":
    case "Partner Assigned":
    case "Open":
    case "In Review":
      return "bg-brand-soft text-brand";
    default:
      return "bg-canvas text-muted";
  }
}
