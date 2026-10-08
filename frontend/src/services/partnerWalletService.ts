// Partner wallet API client.
// NOTE: adjust API_BASE / getToken() to match how the rest of the project
// talks to the backend (e.g. swap fetch for your existing axios instance).

export type TransactionType =
  | 'booking_earning'
  | 'incentive'
  | 'adjustment'
  | 'payout'
  | 'refund_deduction';

export const TRANSACTION_TYPES: ReadonlyArray<{ value: TransactionType; label: string }> = [
  { value: 'booking_earning', label: 'Booking earning' },
  { value: 'incentive', label: 'Incentive' },
  { value: 'adjustment', label: 'Adjustment' },
  { value: 'payout', label: 'Payout' },
  { value: 'refund_deduction', label: 'Refund deduction' },
];

export interface WalletSummary {
  balance: number;
  available: number;
  pending: number;
}

export interface WalletTransaction {
  _id: string;
  type: TransactionType;
  amount: number; // signed: positive = credit, negative = debit
  description?: string;
  reference?: string;
  createdAt: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface TransactionsResponse {
  transactions: WalletTransaction[];
  pagination: Pagination;
}

export interface TransactionQuery {
  type?: TransactionType | '';
  from?: string; // YYYY-MM-DD
  to?: string; // YYYY-MM-DD
  page: number;
  limit: number;
}

const API_BASE: string =
  (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:5000/api';

function getToken(): string | null {
  return localStorage.getItem('token');
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request<T>(path: string, signal?: AbortSignal): Promise<T> {
  const token = getToken();
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      signal,
      headers: {
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err;
    throw new ApiError('Cannot reach the server. Check your connection.', 0);
  }

  if (!res.ok) {
    let message = 'Something went wrong. Please try again.';
    try {
      const body = (await res.json()) as { message?: string };
      if (body.message) message = body.message;
    } catch {
      /* non-JSON error body */
    }
    throw new ApiError(message, res.status);
  }
  return (await res.json()) as T;
}

export function fetchWallet(signal?: AbortSignal): Promise<WalletSummary> {
  return request<WalletSummary>('/partner/wallet', signal);
}

export function fetchTransactions(
  q: TransactionQuery,
  signal?: AbortSignal,
): Promise<TransactionsResponse> {
  const params = new URLSearchParams();
  params.set('page', String(q.page));
  params.set('limit', String(q.limit));
  if (q.type) params.set('type', q.type);
  if (q.from) params.set('from', q.from);
  if (q.to) params.set('to', q.to);
  return request<TransactionsResponse>(`/partner/transactions?${params.toString()}`, signal);
}

export function formatINR(value: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(value);
}