import mongoose, { Document, Schema } from 'mongoose';

export type LedgerType =
  | 'credit'
  | 'debit'
  | 'refund_credit'
  | 'referral_reward'
  | 'failed'
  | 'CREDIT'
  | 'DEBIT'
  | 'REFUND'
  | 'REFERRAL_REWARD'
  | 'FAILED';

export interface IWalletLedger extends Document {
  walletId: mongoose.Types.ObjectId;
  userId: string;
  type: LedgerType;
  amount: number; // in paise
  balanceAfter: number;
  description: string;
  referenceId?: string;
  createdAt: Date;
}

export interface IWallet extends Document {
  userId: string;
  balance: number; // in paise
  createdAt: Date;
  updatedAt: Date;
}

const WalletSchema = new Schema<IWallet>(
  {
    userId: { type: String, required: true, unique: true, index: true },
    balance: { type: Number, required: true, default: 0, min: 0 },
  },
  { timestamps: true }
);

const WalletLedgerSchema = new Schema<IWalletLedger>(
  {
    walletId: { type: Schema.Types.ObjectId, ref: 'Wallet', required: true, index: true },
    userId: { type: String, required: true, index: true },
    type: {
      type: String,
      enum: [
        'credit',
        'debit',
        'refund_credit',
        'referral_reward',
        'failed',
        'CREDIT',
        'DEBIT',
        'REFUND',
        'REFERRAL_REWARD',
        'FAILED',
      ],
      required: true,
    },
    amount: { type: Number, required: true },
    balanceAfter: { type: Number, required: true },
    description: { type: String, required: true },
    referenceId: { type: String, index: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const WalletModel = mongoose.model<IWallet>('Wallet', WalletSchema);
export const WalletLedgerModel = mongoose.model<IWalletLedger>('WalletLedger', WalletLedgerSchema);