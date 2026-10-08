// Partner wallet API: GET /partner/wallet
// The balance (available / pending) is computed on the server from the ledger.
// Nothing here ever calculates or trusts a balance on the client.

export type LedgerType = 'earning' | 'incentive' | 'adjustment' | 'payout' | 'refund_deduction';

export interface LedgerEntry {
  id: string;
  type: LedgerType;
  amount: number; // INR; negative = money leaving the wallet (payout, refund_deduction)
  description: string;
  createdAt: string; // ISO
}

export interface WalletSummary {
  available: number;
  pending: number;
  currency: 'INR';
  recent: LedgerEntry[];
}

// Same base URL and token as transactions.api.ts. The backend mounts every route under /api/v1.
const API_BASE: string =
  (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:5000/api/v1';

const getToken = (): string | null => localStorage.getItem('token');

interface RawEntry {
  id?: string | number;
  _id?: string;
  type: LedgerType;
  description?: string;
  amount: number;
  createdAt: string;
}

interface RawSummary {
  available?: number;
  pending?: number;
  recent?: RawEntry[];
  data?: RawSummary; // { success, data: {...} } envelope
}

const num = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? v : 0);

function normalise(raw: RawSummary): WalletSummary {
  const body = raw.data ?? raw;
  return {
    available: num(body.available),
    pending: num(body.pending),
    currency: 'INR',
    recent: (body.recent ?? []).map((e) => ({
      id: String(e.id ?? e._id ?? `${e.createdAt}-${e.amount}`),
      type: e.type,
      amount: num(e.amount),
      description: e.description ?? '',
      createdAt: e.createdAt,
    })),
  };
}

export async function getWalletSummary(): Promise<WalletSummary> {
  const token = getToken();
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/partner/wallet`, {
      headers: {
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
  } catch {
    throw new Error('Cannot reach the server. Check your connection.');
  }

  if (!res.ok) {
    let message = "We couldn't load your wallet.";
    try {
      const body = (await res.json()) as { message?: string };
      if (body.message) message = body.message;
    } catch {
      /* response had no JSON body */
    }
    throw new Error(message);
  }

  return normalise((await res.json()) as RawSummary);
}