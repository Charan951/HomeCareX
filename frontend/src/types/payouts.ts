export type PayoutStatus = 'pending' | 'processing' | 'paid' | 'failed';

export interface PayoutItem {
  id: string;
  amount: number;
  currency: 'INR';
  status: PayoutStatus;
  method: string | null;
  transactionId: string | null;
  batchId: string | null;
  expectedDate: string | null;
  paidAt: string | null;
  createdAt: string;
}

export interface NextPayout {
  id: string;
  amount: number;
  currency: 'INR';
  status: PayoutStatus;
  expectedDate: string | null;
}

export interface PayoutsList {
  currency: 'INR';
  next: NextPayout | null;
  history: PayoutItem[];
}