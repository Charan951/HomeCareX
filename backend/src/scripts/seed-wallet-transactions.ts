/**
 * Seeds demo wallet transactions for the Test Partner (partner@homecarex.com), so
 * GET /partner/transactions and the /partner/transactions page have something to show.
 *   1) npm run seed:users --workspace=backend
 *   2) npm run seed:wallet --workspace=backend
 *
 * Safe to re-run: every line this script created (referenceId "demo-wallet") is removed and recreated.
 * Dev / staging only.
 */
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { PartnerModel } from '../models/Partner';
import { UserModel } from '../models/User';
import WalletTransactionModel from '../modules/partner-wallet/WalletTransaction';
import type { WalletTransactionStatus, WalletTransactionType } from '../modules/partner-wallet/partner-wallet.constants';

dotenv.config();

const DEMO_REF = 'demo-wallet';
const DAY = 86_400_000;
const daysAgo = (d: number, hour = 12) => new Date(Date.now() - d * DAY + (hour - 12) * 3_600_000);

type Line = [daysAgo: number, type: WalletTransactionType, amount: number, description: string, status?: WalletTransactionStatus];

const LINES: Line[] = [
  [0, 'earning', 640, 'AC deep clean', 'pending'],
  [1, 'earning', 480, 'Kitchen deep clean', 'pending'],
  [2, 'incentive', 500, 'Weekend bonus'],
  [3, 'earning', 720, 'Bathroom deep clean'],
  [5, 'refund_deduction', -320, 'Refund for cancelled visit'],
  [6, 'earning', 560, 'Sofa shampooing'],
  [8, 'payout', -2000, 'Weekly payout to bank'],
  [9, 'adjustment', 150, 'Goodwill adjustment'],
  [11, 'earning', 900, 'Full home cleaning'],
  [14, 'earning', 450, 'Pest control'],
  [16, 'adjustment', -75, 'Late arrival penalty'],
  [20, 'incentive', 800, 'Starter 10 reward'],
  [23, 'earning', 600, 'AC service'],
  [27, 'payout', -1500, 'Weekly payout to bank'],
  [33, 'earning', 520, 'Kitchen deep clean'],
  [41, 'refund_deduction', -200, 'Refund for partial service'],
  [48, 'earning', 780, 'Bathroom deep clean'],
  [55, 'payout', -1800, 'Weekly payout to bank'],
];

async function main() {
  if (process.env.NODE_ENV === 'production') throw new Error('Refusing to seed demo data in production.');
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set (see backend/.env.example).');
  await mongoose.connect(url);

  const partnerUser = await UserModel.findOne({ email: 'partner@homecarex.com' }).select('_id').lean();
  if (!partnerUser) throw new Error('Run "npm run seed:users --workspace=backend" first.');
  const partner = await PartnerModel.findOne({ userId: partnerUser._id }).select('_id').lean();
  if (!partner) throw new Error('No partner profile for partner@homecarex.com. Run the users seed first.');

  await WalletTransactionModel.deleteMany({ partnerId: partner._id, referenceId: DEMO_REF });
  await WalletTransactionModel.insertMany(
    LINES.map(([d, type, amount, description, status], i) => ({
      partnerId: partner._id,
      type,
      amount,
      description,
      status: status ?? 'settled',
      referenceId: DEMO_REF,
      createdAt: daysAgo(d, 9 + (i % 8)),
    })),
  );

  const net = LINES.reduce((sum, l) => sum + l[2], 0);
  console.log(`Seeded ${LINES.length} wallet transactions (ledger sum ${net} INR) for partner@homecarex.com.`);
  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect().catch(() => undefined);
  process.exit(1);
});