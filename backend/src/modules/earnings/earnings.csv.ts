import { toLocalDateString } from '../../utils/dates';
import type { LedgerRowDto } from './earnings.types';

const HEADER = ['Date', 'Booking ID', 'Service', 'Gross (INR)', 'Commission rate (%)', 'Commission (INR)', 'Net (INR)', 'Status', 'Settled on'];

/**
 * One CSV cell. Quotes cells containing , " or a line break, and prefixes a single quote to text a spreadsheet
 * would run as a formula (= + - @), so a service name like "=HYPERLINK(...)" stays plain text in Excel.
 */
export function csvCell(value: string | number | null): string {
  let text = value === null ? '' : String(value);
  if (typeof value === 'string' && /^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

const money = (n: number): string => n.toFixed(2);

export function buildEarningsCsv(rows: LedgerRowDto[], offsetMinutes?: number): string {
  const lines = [HEADER.map(csvCell).join(',')];
  for (const r of rows) {
    lines.push(
      [
        toLocalDateString(new Date(r.earnedAt), offsetMinutes),
        r.bookingId,
        r.serviceName,
        money(r.gross),
        Math.round(r.commissionRate * 10_000) / 100,
        money(r.commission),
        money(r.net),
        r.status,
        r.settledAt ? toLocalDateString(new Date(r.settledAt), offsetMinutes) : null,
      ]
        .map((v) => csvCell(v))
        .join(','),
    );
  }
  // BOM so Excel opens the rupee-free UTF-8 text correctly; CRLF is the CSV standard line ending.
  return '\uFEFF' + lines.join('\r\n') + '\r\n';
}