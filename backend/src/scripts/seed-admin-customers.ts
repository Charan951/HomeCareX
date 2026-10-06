/**
 * Seeds 27 demo customers so /admin/customers has something to filter, sort and paginate.
 *   npm run seed:customers --workspace=backend
 *
 * - Emails are <name>@seed.homecarex.test, so re-running wipes and recreates ONLY these users (and their bookings).
 * - Every 7th customer is blocked; some have no bookings and never logged in.
 * - Bookings mix paymentStatus PAID / PENDING / REFUNDED / FAILED, so "LTV" (PAID only) differs from "bookings".
 * - Login password = SEED_PASSWORD (default Admin@123). Dev / staging only.
 */
import dotenv from 'dotenv';
import mongoose, { Types } from 'mongoose';
import bcrypt from 'bcryptjs';
import { BookingModel } from '../models/Booking';
import { UserModel } from '../models/User';

dotenv.config();

const FIRST = ['Aarav', 'Bhavya', 'Charan', 'Divya', 'Esha', 'Farhan', 'Gauri', 'Harsha', 'Ishita', 'Jayant', 'Kavya', 'Lokesh', 'Meera'];
const LAST = ['Reddy', 'Sharma', 'Iyer'];
const SERVICES = ['Deep Home Cleaning', 'AC Service & Gas Refill', 'Plumbing - Tap Leak Repair', 'Electrician Visit', 'At-home Spa'];
const PAYMENT: Array<'PAID' | 'PENDING' | 'REFUNDED' | 'FAILED'> = ['PAID', 'PAID', 'PAID', 'PENDING', 'REFUNDED', 'FAILED'];
const STATUS_FOR: Record<string, 'completed' | 'created' | 'cancelled_by_customer'> = {
  PAID: 'completed',
  PENDING: 'created',
  REFUNDED: 'cancelled_by_customer',
  FAILED: 'created',
};

const DOMAIN = '@seed.homecarex.test';
const daysAgo = (n: number) => new Date(Date.now() - n * 24 * 3600 * 1000);

async function main() {
  if (process.env.NODE_ENV === 'production') throw new Error('Refusing to seed demo customers in production.');
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set (see backend/.env.example).');
  await mongoose.connect(url);

  const old = await UserModel.find({ email: new RegExp(`${DOMAIN.replace('.', '\\.')}$`) }).select('_id');
  await BookingModel.deleteMany({ customerId: { $in: old.map((u) => u._id) } });
  await UserModel.deleteMany({ _id: { $in: old.map((u) => u._id) } });

  const passwordHash = await bcrypt.hash(process.env.SEED_PASSWORD || 'Admin@123', 10);
  const customers = Array.from({ length: 27 }, (_, i) => {
    const name = `${FIRST[i % FIRST.length]} ${LAST[i % LAST.length]}`;
    return {
      _id: new Types.ObjectId(),
      name,
      email: `${name.toLowerCase().replace(' ', '.')}.${i + 1}${DOMAIN}`,
      phone: `91000${String(10000 + i)}`,
      passwordHash,
      role: 'customer' as const,
      status: i % 7 === 6 ? ('blocked' as const) : ('active' as const),
      createdAt: daysAgo(120 - i * 4),
      // every 5th customer never logged in
      ...(i % 5 === 4 ? {} : { lastLoginAt: daysAgo((i * 3) % 40) }),
    };
  });
  await UserModel.insertMany(customers);

  const bookings = customers.flatMap((c, i) => {
    const count = i % 4 === 3 ? 0 : (i * 5) % 7; // 0..6, with a few zero-booking customers
    return Array.from({ length: count }, (_, j) => {
      const paymentStatus = PAYMENT[(i + j) % PAYMENT.length];
      const total = 400 + ((i * 137 + j * 211) % 1600);
      return {
        customerId: c._id,
        customerName: c.name,
        serviceName: SERVICES[(i + j) % SERVICES.length],
        status: STATUS_FOR[paymentStatus],
        paymentStatus,
        scheduledAt: daysAgo(100 - i * 3 - j * 5),
        createdAt: daysAgo(101 - i * 3 - j * 5),
        address: { line1: '12, Demo Street', city: 'Hyderabad', pincode: '500081' },
        priceBreakdown: { base: total - 49, convenienceFee: 49, total },
      };
    });
  });
  await BookingModel.insertMany(bookings);

  console.log(`Seeded ${customers.length} customers (${customers.filter((c) => c.status === 'blocked').length} blocked) and ${bookings.length} bookings.`);
  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect();
  process.exit(1);
});
