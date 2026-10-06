import { AppError } from '../../utils/AppError';
import { MAX_WALLET_AMOUNT_INR } from './wallet.constants';

/** Rupees -> integer paise. Rejects NaN, <= 0, > 2 decimals and over-limit amounts. */
export function rupeesToPaise(amount: unknown): number {
  if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) {
    throw new AppError(422, 'INVALID_AMOUNT', 'Amount must be greater than zero');
  }
  if (amount > MAX_WALLET_AMOUNT_INR) throw new AppError(422, 'INVALID_AMOUNT', 'Amount is too large');
  const paise = Math.round(amount * 100);
  if (Math.abs(paise / 100 - amount) > 1e-9) throw new AppError(422, 'INVALID_AMOUNT', 'Amount can have at most 2 decimals');
  return paise;
}

export const paiseToRupees = (paise: number): number => paise / 100;
