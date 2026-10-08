/** Ledger line types for the partner wallet. */
export const WALLET_TRANSACTION_TYPES = ['earning', 'incentive', 'adjustment', 'payout', 'refund_deduction'] as const;
export type WalletTransactionType = (typeof WALLET_TRANSACTION_TYPES)[number];

/** `pending` = earned but not yet cleared for withdrawal; `settled` = counted in the available balance. */
export const WALLET_TRANSACTION_STATUSES = ['pending', 'settled'] as const;
export type WalletTransactionStatus = (typeof WALLET_TRANSACTION_STATUSES)[number];

/** Always money in (amount > 0). `adjustment` is the only type that may be either sign. */
export const CREDIT_ONLY_TYPES: readonly WalletTransactionType[] = ['earning', 'incentive'];

/** Always money out (amount < 0). */
export const DEBIT_ONLY_TYPES: readonly WalletTransactionType[] = ['payout', 'refund_deduction'];