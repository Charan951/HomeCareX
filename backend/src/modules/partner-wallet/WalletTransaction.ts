import { Schema, model, models, type InferSchemaType, type Model } from 'mongoose';
import {
  CREDIT_ONLY_TYPES,
  DEBIT_ONLY_TYPES,
  WALLET_TRANSACTION_STATUSES,
  WALLET_TRANSACTION_TYPES,
} from './partner-wallet.constants';

/**
 * One line of a partner's wallet ledger. The balance is never stored: it is the SUM of `amount`
 * over a partner's lines, so it can never drift from the ledger.
 * `amount` is SIGNED INR (credit > 0, debit < 0), same unit as Earning.net.
 */
const WalletTransactionSchema = new Schema(
  {
    /** Partner._id (same id Earning and Booking use). */
    partnerId: { type: Schema.Types.ObjectId, ref: 'Partner', required: true },
    type: { type: String, enum: WALLET_TRANSACTION_TYPES, required: true },
    amount: {
      type: Number,
      required: true,
      validate: { validator: (v: number) => Number.isFinite(v) && v !== 0, message: 'amount must be a non-zero number' },
    },
    status: { type: String, enum: WALLET_TRANSACTION_STATUSES, default: 'settled' },
    description: { type: String, trim: true, maxlength: 200, default: '' },
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking' },
    /** Payout id, incentive id, admin note id... whatever produced this line. */
    referenceId: { type: String, trim: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

// The sign must match the type, otherwise "balance = ledger sum" would silently be wrong.
WalletTransactionSchema.pre('validate', function () {
  if (typeof this.amount !== 'number' || !this.type) return;
  if (CREDIT_ONLY_TYPES.includes(this.type) && this.amount < 0) {
    this.invalidate('amount', `${this.type} must be a positive amount`);
  }
  if (DEBIT_ONLY_TYPES.includes(this.type) && this.amount > 0) {
    this.invalidate('amount', `${this.type} must be a negative amount`);
  }
});

WalletTransactionSchema.index({ partnerId: 1, createdAt: -1 });
WalletTransactionSchema.index({ partnerId: 1, type: 1, createdAt: -1 });

export type WalletTransaction = InferSchemaType<typeof WalletTransactionSchema>;

// `models.X ||` avoids OverwriteModelError under ts-node-dev hot reloads.
export const WalletTransactionModel: Model<WalletTransaction> =
  (models.WalletTransaction as Model<WalletTransaction> | undefined) ??
  model<WalletTransaction>('WalletTransaction', WalletTransactionSchema);

export default WalletTransactionModel;