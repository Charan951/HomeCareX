export const LEDGER_TYPES = ['credit', 'debit', 'refund_credit', 'referral_reward'] as const;
export type LedgerType = (typeof LEDGER_TYPES)[number];

/** Types that add money to the wallet; everything else removes it. */
export const CREDIT_TYPES: readonly LedgerType[] = ['credit', 'refund_credit', 'referral_reward'];

/** Hard ceiling for one movement (INR). Stops fat-finger / abusive amounts. */
export const MAX_WALLET_AMOUNT_INR = 100_000;
