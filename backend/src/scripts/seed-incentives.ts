/**
 * Seeds demo incentive campaigns and completed jobs for the Test Partner (partner@homecarex.com),
 * so GET /partner/incentives and the /partner/incentives page have something to show.
 *   1) npm run seed:users --workspace=backend
 *   2) npm run seed:incentives --workspace=backend
 *
 * Safe to re-run: every "[Demo]" campaign and every demo job it created is removed and recreated.
 * Dev / staging only.
 */
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { BookingModel } from '../models/Booking';
import { IncentiveModel } from '../models/Incentive';
import { PartnerModel } from '../models/Partner';
import { UserModel } from '../models/User';

dotenv.config();

const DAY = 86_400_000;
const DEMO_SERVICE = 'Demo incentive job';
const daysFromNow = (d: number) => new Date(Date.now() + d * DAY);

/** n timestamps spread evenly from `start` to `end` (both inside the past). */
const spread = (n: number, start: Date, end: Date): Date[] =>
  Array.from({ length: n }, (_, i) => new Date(start.getTime() + ((i + 1) / (n + 1)) * (end.getTime() - start.getTime())));

async function main() {
  if (process.env.NODE_ENV === 'production') throw new Error('Refusing to seed demo data in production.');
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set (see backend/.env.example).');
  await mongoose.connect(url);

  const partnerUser = await UserModel.findOne({ email: 'partner@homecarex.com' }).select('_id').lean();
  const customer = await UserModel.findOne({ email: 'customer@homecarex.com' }).select('_id name').lean();
  if (!partnerUser || !customer) throw new Error('Run "npm run seed:users --workspace=backend" first.');

  await PartnerModel.updateOne(
    { userId: partnerUser._id },
    { $set: { ratingAvg: 4.7, ratingCount: 120 } },
    { upsert: true },
  );
  const partner = await PartnerModel.findOne({ userId: partnerUser._id }).select('_id').lean();
  if (!partner) throw new Error('Could not create partner profile');

  // Wipe the previous demo run.
  await IncentiveModel.deleteMany({ title: /^\[Demo\]/ });
  await BookingModel.deleteMany({ partnerId: partner._id, serviceName: DEMO_SERVICE });

  const campaigns = [
    // Active: 32 of 40 (the spec's example)
    { title: '[Demo] Festive 40', description: 'Complete 40 jobs this month and earn a bonus.', targetJobs: 40, rewardAmount: 2000, startsAt: daysFromNow(-20), endsAt: daysFromNow(10), minRating: null },
    // Active but the partner is not eligible (needs 4.9, partner has 4.7)
    { title: '[Demo] Top-rated 8', description: 'For partners rated 4.9 or more.', targetJobs: 8, rewardAmount: 500, startsAt: daysFromNow(-3), endsAt: daysFromNow(4), minRating: 4.9 },
    // Upcoming
    { title: '[Demo] Diwali rush 25', description: 'Be ready for the busiest weeks of the year.', targetJobs: 25, rewardAmount: 3000, startsAt: daysFromNow(5), endsAt: daysFromNow(20), minRating: null },
    // Completed (target reached in the window)
    { title: '[Demo] Starter 10', description: 'Complete 10 jobs.', targetJobs: 10, rewardAmount: 800, startsAt: daysFromNow(-45), endsAt: daysFromNow(-15), minRating: null },
    // Expired (window over, target missed)
    { title: '[Demo] Monsoon 30', description: 'Complete 30 jobs.', targetJobs: 30, rewardAmount: 1500, startsAt: daysFromNow(-80), endsAt: daysFromNow(-50), minRating: null },
  ];
  await IncentiveModel.insertMany([...campaigns, { title: '[Demo] Switched off', description: 'Hidden from partners.', targetJobs: 5, rewardAmount: 100, startsAt: daysFromNow(-5), endsAt: daysFromNow(5), isActive: false }]);

  // Completed jobs: 32 in the Festive window, 12 in Starter, 18 in Monsoon.
  const completions = [
    ...spread(32, daysFromNow(-19), daysFromNow(-1)),
    ...spread(12, daysFromNow(-44), daysFromNow(-16)),
    ...spread(18, daysFromNow(-79), daysFromNow(-51)),
  ];
  await BookingModel.insertMany(
    completions.map((completedAt) => ({
      customerId: customer._id,
      customerName: customer.name,
      partnerId: partner._id,
      serviceName: DEMO_SERVICE,
      address: { line1: '12 Demo Street', city: 'Hyderabad', pincode: '500001' },
      scheduledAt: new Date(completedAt.getTime() - 2 * 3_600_000),
      status: 'completed',
      startedAt: new Date(completedAt.getTime() - 3_600_000),
      completedAt,
    })),
  );

  console.log(`Seeded ${campaigns.length} campaigns (+1 switched off) and ${completions.length} completed jobs for partner@homecarex.com`);
  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect();
  process.exit(1);
});