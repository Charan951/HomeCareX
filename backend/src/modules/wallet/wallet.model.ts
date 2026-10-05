import { Schema, model, models, type Document, type Model, Types } from 'mongoose';
import { LEDGER_TYPES, type LedgerType } from './wallet.constants';

/**
 * Money is stored as INTEGER PAISE so $inc never accumulates float error.
 * The API converts to rupees at the edge (see wallet.service).
 */
export interface IWallet extends Document {
  customerId: Types.ObjectId;
  balancePaise: number;
  createdAt: Date;
  updatedAt: Date;
}

const WalletSchema = new Schema<IWallet>(
  {
    customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    balancePaise: { type: Number, default: 0, min: 0, validate: { validator: Number.isInteger, message: 'balancePaise must be an integer' } },
  },
  { timestamps: true },
);

export interface IWalletLedger extends Document {
  customerId: Types.ObjectId;
  type: LedgerType;
  amountPaise: number;
  balanceAfterPaise: number;
  description: string;
  bookingId?: Types.ObjectId;
  paymentId?: Types.ObjectId;
  /** Same key twice = same movement: the second call returns the first entry. */
  idempotencyKey?: string;
  createdAt: Date;
}

const WalletLedgerSchema = new Schema<IWalletLedger>(
  {
    customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: LEDGER_TYPES, required: true },
    amountPaise: { type: Number, required: true, min: 1 },
    balanceAfterPaise: { type: Number, required: true, min: 0 },
    description: { type: String, required: true, trim: true, maxlength: 200 },
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking' },
    paymentId: { type: Schema.Types.ObjectId, ref: 'Payment' },
    idempotencyKey: { type: String, trim: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

WalletLedgerSchema.index({ customerId: 1, createdAt: -1 });
WalletLedgerSchema.index(
  { customerId: 1, idempotencyKey: 1 },
  { unique: true, name: 'uniq_wallet_idem_key', partialFilterExpression: { idempotencyKey: { $exists: true } } },
);

export const WalletModel: Model<IWallet> = (models.Wallet as Model<IWallet>) || model<IWallet>('Wallet', WalletSchema);
export const WalletLedgerModel: Model<IWalletLedger> =
  (models.WalletLedger as Model<IWalletLedger>) || model<IWalletLedger>('WalletLedger', WalletLedgerSchema);
