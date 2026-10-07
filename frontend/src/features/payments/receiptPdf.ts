import { formatMoney } from "./money";
import { loadReceiptLogo } from "./receiptLogo.ts";
import {
  STATUS_LABEL,
  fmtLine,
  fmtReceiptDate,
  receiptFileName,
  type ReceiptData,
} from "./receiptData";

type RGB = [number, number, number];
const INK: RGB = [30, 27, 46];
const MUTED: RGB = [107, 104, 128];
const LINE: RGB = [228, 228, 239];
const BRAND: RGB = [67, 56, 202];
const ORANGE: RGB = [245, 115, 31];
const STATUS_COLORS: Record<string, { bg: RGB; fg: RGB }> = {
  PAID: { bg: [220, 252, 231], fg: [21, 128, 61] },
  PENDING: { bg: [255, 234, 219], fg: [154, 52, 18] },
  FAILED: { bg: [253, 232, 232], fg: [185, 28, 28] },
  REFUNDED: { bg: [238, 236, 251], fg: [67, 56, 202] },
};

/**
 * Builds the receipt as a real vector PDF (A4, selectable text), not a screenshot.
 * jsPDF and the embedded font are loaded on demand so they never weigh down the page.
 * Returns the file so callers can save it; throws on failure.
 */
export async function buildReceiptPdf(data: ReceiptData): Promise<{ save: () => void; fileName: string }> {
  const [{ jsPDF }, fonts, logo] = await Promise.all([import("jspdf"), import("./receiptFonts"), loadReceiptLogo()]);
  const doc = new jsPDF({ unit: "mm", format: "a4", compress: true });
  doc.addFileToVFS("NotoSans-Regular.ttf", fonts.NOTO_SANS_REGULAR);
  doc.addFont("NotoSans-Regular.ttf", "NotoSans", "normal");
  doc.addFileToVFS("NotoSans-Bold.ttf", fonts.NOTO_SANS_BOLD);
  doc.addFont("NotoSans-Bold.ttf", "NotoSans", "bold");

  const W = 210;
  const M = 18; // page margin
  const R = W - M;
  const CW = R - M;
  const BOTTOM = 297 - 18;
  let y = M;

  const font = (bold: boolean, size: number, color: RGB) => {
    doc.setFont("NotoSans", bold ? "bold" : "normal");
    doc.setFontSize(size);
    doc.setTextColor(...color);
  };
  const rule = (yy: number, color: RGB = LINE, width = 0.25) => {
    doc.setDrawColor(...color);
    doc.setLineWidth(width);
    doc.line(M, yy, R, yy);
  };
  const ensure = (needed: number) => {
    if (y + needed > BOTTOM) {
      doc.addPage();
      y = M;
    }
  };

  // ---- Header ----
  const LOGO_SIZE = 15; // mm
  let textX = M;
  if (logo) {
    doc.addImage(logo, "PNG", M, y, LOGO_SIZE, LOGO_SIZE);
    textX = M + LOGO_SIZE + 3;
  }
  font(true, 20, ORANGE);
  doc.text("Home", textX, y + 8);
  const homeW = doc.getTextWidth("Home");
  font(true, 20, BRAND);
  doc.text("CareX", textX + homeW, y + 8);
  font(false, 9, MUTED);
  doc.text("Home Services & Care", textX, y + 13.5);

  font(true, 13, INK);
  doc.text("Payment Receipt", R, y + 5, { align: "right" });
  font(false, 9, MUTED);
  doc.text(`Receipt No: ${data.receiptNo}`, R, y + 11, { align: "right" });
  doc.text(`Date: ${fmtReceiptDate(data.paymentDate)}`, R, y + 16, { align: "right" });

  // Status badge
  const label = STATUS_LABEL[data.status];
  const col = STATUS_COLORS[data.status] ?? STATUS_COLORS.PENDING;
  font(true, 8.5, col.fg);
  const bw = doc.getTextWidth(label) + 8;
  doc.setFillColor(...col.bg);
  doc.roundedRect(R - bw, y + 19, bw, 6.5, 1.5, 1.5, "F");
  doc.text(label, R - bw / 2, y + 23.5, { align: "center" });

  y += 30;
  rule(y, INK, 0.5);
  y += 8;

  // ---- Labelled field helper (returns height used) ----
  const field = (x: number, yy: number, w: number, lab: string, value: string): number => {
    font(false, 7.5, MUTED);
    doc.text(lab.toUpperCase(), x, yy);
    font(false, 10, INK);
    const lines = doc.splitTextToSize(value, w) as string[];
    doc.text(lines, x, yy + 4.6);
    return 4.6 + lines.length * 4.4 + 2.5;
  };
  const section = (x: number, title: string) => {
    font(true, 8.5, BRAND);
    doc.text(title, x, y);
    doc.setDrawColor(...LINE);
    doc.setLineWidth(0.25);
    doc.line(x, y + 1.8, x + (CW - 10) / 2, y + 1.8);
  };

  // ---- Customer + Booking (two columns) ----
  const colW = (CW - 10) / 2;
  const x2 = M + colW + 10;
  const cust: [string, string][] = [];
  if (data.customer.name) cust.push(["Name", data.customer.name]);
  if (data.customer.email) cust.push(["Email", data.customer.email]);
  if (data.customer.phone) cust.push(["Phone", data.customer.phone]);
  const bk: [string, string][] = [
    ["Service", data.booking.service],
    ["Booking ID", data.booking.bookingRef],
  ];
  if (data.booking.serviceDate) bk.push(["Service date", data.booking.serviceDate]);
  if (data.booking.serviceTime) bk.push(["Time", data.booking.serviceTime]);

  ensure(50);
  section(M, "CUSTOMER");
  section(x2, "BOOKING");
  let yl = y + 7;
  let yr = y + 7;
  for (const [l, v] of cust) yl += field(M, yl, colW, l, v);
  for (const [l, v] of bk) yr += field(x2, yr, colW, l, v);
  y = Math.max(yl, yr) + 1;

  if (data.booking.address) {
    ensure(20);
    y += 2;
    y += field(M, y, CW, "Service address", data.booking.address);
  }

  // ---- Payment information ----
  y += 5;
  ensure(32);
  font(true, 8.5, BRAND);
  doc.text("PAYMENT INFORMATION", M, y);
  rule(y + 1.8);
  y += 7;
  const q = CW / 4;
  const info: [string, string][] = [
    ["Payment method", data.payment.method],
    ["Transaction ID", data.payment.transactionId],
    ["Payment date", fmtReceiptDate(data.paymentDate)],
    ["Payment status", STATUS_LABEL[data.status]],
  ];
  let hmax = 0;
  info.forEach(([l, v], i) => {
    hmax = Math.max(hmax, field(M + i * q, y, q - 3, l, v));
  });
  y += hmax + 4;

  // ---- Price table ----
  ensure(40 + data.lines.length * 8);
  doc.setFillColor(250, 250, 252);
  doc.rect(M, y, CW, 8, "F");
  font(true, 8, MUTED);
  doc.text("DESCRIPTION", M + 3, y + 5.3);
  doc.text("AMOUNT", R - 3, y + 5.3, { align: "right" });
  y += 8;
  rule(y);

  for (const l of data.lines) {
    ensure(10);
    if (l.emphasis) {
      rule(y + 0.5);
      y += 0.5;
    }
    font(!!l.emphasis, 10, l.emphasis ? INK : MUTED);
    doc.text(l.label, M + 3, y + 6.2);
    font(true, 10, INK);
    doc.text(fmtLine(l), R - 3, y + 6.2, { align: "right" });
    y += 9;
    if (!l.emphasis) rule(y);
  }

  // ---- Total ----
  ensure(24);
  y += 3;
  rule(y, INK, 0.5);
  y += 1;
  doc.setFillColor(238, 236, 251);
  doc.rect(M, y, CW, 13, "F");
  font(true, 11, INK);
  doc.text("TOTAL PAID", M + 3, y + 8.4);
  font(true, 15, BRAND);
  doc.text(formatMoney(data.total), R - 3, y + 8.8, { align: "right" });
  y += 13;
  rule(y, INK, 0.5);

  // ---- Footer ----
  ensure(30);
  y += 12;
  font(true, 10, INK);
  doc.text("Thank you for choosing HomeCareX.", M, y);
  y += 7;
  font(true, 9, INK);
  doc.text("HomeCareX", M, y);
  font(false, 8.5, MUTED);
  doc.text("Professional Home Services", M, y + 4.5);
  font(false, 7.5, MUTED);
  doc.text("This is a computer-generated receipt and does not require a signature.", M, 297 - 12);

  const fileName = receiptFileName(data.receiptNo);
  return { fileName, save: () => doc.save(fileName) };
}