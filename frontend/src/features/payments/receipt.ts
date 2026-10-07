import { methodLabel } from "./methods";
import type { PaymentRow } from "@/types/payment";

const escapeHtml = (v: string): string =>
  v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

/** Self-contained printable receipt. Every value is escaped; nothing from the server is trusted as HTML. */
export function buildReceiptHtml(p: PaymentRow): string {
  const rows: [string, string][] = [
    ["Receipt no.", p.receiptNo ?? "—"],
    ["Booking", p.bookingRef],
    ["Service", p.serviceName],
    ["Paid on", p.paidAt ? new Date(p.paidAt).toLocaleString("en-IN") : "—"],
    ["Method", methodLabel(p.method)],
    ["Amount paid", `₹${p.amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`],
  ];
  const body = rows.map(([k, v]) => `<tr><th>${escapeHtml(k)}</th><td>${escapeHtml(v)}</td></tr>`).join("");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Receipt ${escapeHtml(p.receiptNo ?? "")}</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>body{font-family:system-ui,sans-serif;max-width:480px;margin:2rem auto;padding:0 1rem;color:#1a1a2e}
h1{font-size:1.25rem}table{width:100%;border-collapse:collapse}th,td{text-align:left;padding:.5rem 0;border-bottom:1px solid #e4e4ef}
th{color:#6b6880;font-weight:500;width:40%}</style></head>
<body><h1>HomeCareX payment receipt</h1><table>${body}</table></body></html>`;
}

export function openReceipt(p: PaymentRow): void {
  const url = URL.createObjectURL(new Blob([buildReceiptHtml(p)], { type: "text/html" }));
  window.open(url, "_blank", "noopener");
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
