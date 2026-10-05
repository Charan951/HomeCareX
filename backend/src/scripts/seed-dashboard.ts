/**
 * Seeds demo data so GET /customer/dashboard has something to show.
 *   1) npm run seed:users --workspace=backend        (creates customer@homecarex.com etc.)
 *   2) npm run seed:dashboard --workspace=backend
 *
 * Safe to re-run: catalog + demo users are upserted; the demo customers' addresses,
 * bookings and notifications are wiped and recreated. Dev / staging only.
 *
 * Creates:
 *   - 6 categories, 10 services
 *   - customer A (customer@homecarex.com): 2 addresses, 2 live bookings, 1 upcoming, 1 completed, 2 unread notifications
 *   - customer B (customer2@homecarex.com): 1 address, 1 live booking   -> proves A never sees B's data
 *   - customer C (customer3@homecarex.com): nothing                     -> the "new customer" welcome screen
 *   - 2 demo partners (Ramesh Kumar, Kiran Mehta)
 */
import dotenv from 'dotenv';
import mongoose, { Types } from 'mongoose';
import bcrypt from 'bcryptjs';
import { AddressModel } from '../models/Address';
import { BookingModel } from '../models/Booking';
import { CategoryModel } from '../models/Category';
import { NotificationModel } from '../models/Notification';
import { PartnerModel } from '../models/Partner';
import { ServiceModel } from '../models/Service';
import { UserModel } from '../models/User';
import type { BookingStatus } from '../modules/bookings/bookings.constants';

dotenv.config();

const HOUR = 3_600_000;
const inHours = (h: number) => new Date(Date.now() + h * HOUR);

const CATEGORIES = [
  { slug: 'home-cleaning', name: 'Home Cleaning', icon: '🧹', sortOrder: 1 },
  { slug: 'appliance-repair', name: 'Appliance Repair & Service', icon: '🔧', sortOrder: 2 },
  { slug: 'salon-spa', name: 'Salon & Spa', icon: '💆', sortOrder: 3 },
  { slug: 'electrical-plumbing', name: 'Electrical & Plumbing', icon: '💡', sortOrder: 4 },
  { slug: 'painting', name: 'Painting & Waterproofing', icon: '🎨', sortOrder: 5 },
  { slug: 'pest-control', name: 'Pest Control', icon: '🐜', sortOrder: 6 },
];

// category slug, service slug, name, price, minutes, rating, ratingCount, bookingsCount
const SERVICES: [string, string, string, number, number, number, number, number][] = [
  ['home-cleaning', 'deep-home-cleaning', 'Deep Home Cleaning', 1499, 180, 4.8, 2140, 900],
  ['home-cleaning', 'sofa-carpet-shampooing', 'Sofa & Carpet Shampooing', 899, 90, 4.7, 980, 400],
  ['appliance-repair', 'ac-service-gas-refill', 'AC Service & Gas Refill', 599, 60, 4.6, 3210, 1200],
  ['appliance-repair', 'ro-water-purifier-service', 'RO/Water Purifier Service', 399, 45, 4.5, 1120, 500],
  ['salon-spa', 'at-home-spa-for-women', 'At-Home Spa for Women', 1299, 120, 4.9, 1560, 700],
  ['electrical-plumbing', 'electrician-visit-general', 'Electrician Visit (General)', 249, 30, 4.4, 870, 350],
  ['electrical-plumbing', 'plumbing-tap-leak-repair', 'Plumbing – Tap & Leak Repair', 299, 45, 4.6, 640, 300],
  ['painting', 'room-painting-per-room', 'Room Painting (per room)', 3499, 480, 4.6, 430, 150],
  ['pest-control', 'general-pest-control', 'General Pest Control', 799, 60, 4.5, 1980, 600],
  ['pest-control', 'termite-treatment', 'Termite Treatment', 1999, 120, 4.4, 310, 90],
];

async function upsertUser(
  u: { name: string; email: string; phone: string; role: 'customer' | 'partner' },
  passwordHash: string,
) {
  await UserModel.updateOne(
    { email: u.email },
    { $set: { ...u, status: 'active', failedLogins: 0 }, $setOnInsert: { passwordHash } },
    { upsert: true },
  );
  const doc = await UserModel.findOne({ email: u.email }).select('_id name').lean();
  if (!doc) throw new Error(`Could not create user ${u.email}`);
  return doc;
}

async function upsertPartner(userId: Types.ObjectId, categories: Types.ObjectId[]) {
  await PartnerModel.updateOne(
    { userId },
    { $set: { status: 'active', categories, ratingAvg: 4.7, ratingCount: 120 } },
    { upsert: true },
  );
  const doc = await PartnerModel.findOne({ userId }).select('_id').lean();
  if (!doc) throw new Error('Could not create partner');
  return doc._id;
}

async function main() {
  if (process.env.NODE_ENV === 'production') throw new Error('Refusing to seed demo data in production.');
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set (see backend/.env.example).');
  await mongoose.connect(url);
  const passwordHash = await bcrypt.hash(process.env.SEED_PASSWORD || 'Admin@123', 12);

  // ---- catalog ----
  const catId = new Map<string, Types.ObjectId>();
  for (const c of CATEGORIES) {
    await CategoryModel.updateOne({ slug: c.slug }, { $set: { ...c, active: true } }, { upsert: true });
    const doc = await CategoryModel.findOne({ slug: c.slug }).select('_id').lean();
    if (doc) catId.set(c.slug, doc._id);
  }
  const svc = new Map<string, { id: Types.ObjectId; name: string; categoryId: Types.ObjectId; price: number }>();
  for (const [cat, slug, name, basePrice, durationMinutes, ratingAvg, ratingCount, bookingsCount] of SERVICES) {
    const categoryId = catId.get(cat)!;
    await ServiceModel.updateOne(
      { slug },
      { $set: { slug, name, categoryId, basePrice, durationMinutes, ratingAvg, ratingCount, bookingsCount, isActive: true } },
      { upsert: true },
    );
    const doc = await ServiceModel.findOne({ slug }).select('_id').lean();
    if (doc) svc.set(slug, { id: doc._id, name, categoryId, price: basePrice });
  }

  // ---- people ----
  const A = await upsertUser({ name: 'Test Customer', email: 'customer@homecarex.com', phone: '9000000006', role: 'customer' }, passwordHash);
  const B = await upsertUser({ name: 'Bharat Singh', email: 'customer2@homecarex.com', phone: '9000000007', role: 'customer' }, passwordHash);
  await upsertUser({ name: 'Nisha Verma', email: 'customer3@homecarex.com', phone: '9000000008', role: 'customer' }, passwordHash);
  const rameshUser = await upsertUser({ name: 'Ramesh Kumar', email: 'ramesh.partner@homecarex.com', phone: '9000000011', role: 'partner' }, passwordHash);
  const kiranUser = await upsertUser({ name: 'Kiran Mehta', email: 'kiran.partner@homecarex.com', phone: '9000000012', role: 'partner' }, passwordHash);
  const ramesh = await upsertPartner(rameshUser._id, [catId.get('home-cleaning')!]);
  const kiran = await upsertPartner(kiranUser._id, [catId.get('electrical-plumbing')!]);

  // ---- wipe + recreate the demo customers' own data ----
  const demoIds = [A._id, B._id];
  await Promise.all([
    AddressModel.deleteMany({ customerId: { $in: demoIds } }),
    BookingModel.deleteMany({ customerId: { $in: demoIds } }),
    NotificationModel.deleteMany({ userId: { $in: demoIds } }),
  ]);

  await AddressModel.insertMany([
    { customerId: A._id, label: 'Home', line1: 'Flat 302, Manjeera Trinity', line2: 'Kukatpally', state: 'Telangana', city: 'Hyderabad', pincode: '500072', isDefault: true },
    { customerId: A._id, label: 'Office', line1: 'WeWork, Prestige Tech Park', line2: 'Hitech City', state: 'Telangana', city: 'Hyderabad', pincode: '500081', isDefault: false },
    { customerId: B._id, label: 'Home', line1: '14, Road No. 5, Jubilee Hills', line2: 'Jubilee Hills', state: 'Telangana', city: 'Hyderabad', pincode: '500033', isDefault: true },
  ]);

  const homeA = { line1: 'Flat 302, Manjeera Trinity', area: 'Kukatpally', city: 'Hyderabad', pincode: '500072' };
  const homeB = { line1: '14, Road No. 5, Jubilee Hills', area: 'Jubilee Hills', city: 'Hyderabad', pincode: '500033' };

  function booking(
    customer: { _id: Types.ObjectId; name: string },
    address: typeof homeA,
    slug: string,
    status: BookingStatus,
    scheduledAt: Date,
    partnerId: Types.ObjectId | null,
  ) {
    const s = svc.get(slug)!;
    const fee = 49;
    return {
      customerId: customer._id,
      partnerId,
      categoryId: s.categoryId,
      serviceName: s.name,
      customerName: customer.name,
      status,
      statusHistory: [{ from: null, to: status, at: new Date(), actorRole: 'system' as const }],
      scheduledAt,
      address,
      priceBreakdown: { base: s.price, convenienceFee: fee, total: s.price + fee },
    };
  }

  await BookingModel.insertMany([
    // customer A — two live, one upcoming, one finished
    booking(A, homeA, 'deep-home-cleaning', 'in_progress', inHours(-1), ramesh),
    booking(A, homeA, 'plumbing-tap-leak-repair', 'en_route', inHours(1), kiran),
    booking(A, homeA, 'ac-service-gas-refill', 'assigned', inHours(20), ramesh),
    booking(A, homeA, 'electrician-visit-general', 'completed', inHours(-24 * 20), kiran),
    // customer B — must never appear on A's dashboard
    booking(B, homeB, 'at-home-spa-for-women', 'en_route', inHours(2), kiran),
  ]);

  await NotificationModel.insertMany([
    { userId: A._id, type: 'booking', payload: { title: 'Kiran is on the way', body: 'Your plumbing visit starts soon.' }, readAt: null },
    { userId: A._id, type: 'offer', payload: { title: '20% off Salon & Spa', body: 'Use code SPA20 this month.' }, readAt: null },
  ]);

  console.log('Seeded dashboard demo data.');
  console.log('  customer A  customer@homecarex.com   (data-rich)');
  console.log('  customer B  customer2@homecarex.com  (one booking of their own)');
  console.log('  customer C  customer3@homecarex.com  (new customer, empty)');
  console.log(`  password    ${process.env.SEED_PASSWORD || 'Admin@123'}`);
  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect();
  process.exit(1);
});
