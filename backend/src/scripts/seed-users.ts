/**
 * Seeds one login per role. Safe to re-run: existing emails are updated, not duplicated.
 *   npm run seed:users --workspace=backend
 * Password comes from SEED_PASSWORD (default Admin@123). Dev / staging only.
 */
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { UserModel, type UserRole } from '../models/User';

dotenv.config();

const SEED_USERS: { name: string; email: string; phone: string; role: UserRole }[] = [
  { name: 'HomeCareX Admin', email: 'admin@homecarex.com', phone: '9000000001', role: 'admin' },
  { name: 'Test Partner', email: 'partner@homecarex.com', phone: '9000000005', role: 'partner' },
  { name: 'Test Customer', email: 'customer@homecarex.com', phone: '9000000006', role: 'customer' },
];

async function main() {
  if (process.env.NODE_ENV === 'production') throw new Error('Refusing to seed users in production.');
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set (see backend/.env.example).');
  const password = process.env.SEED_PASSWORD || 'Admin@123';

  await mongoose.connect(url);
  const passwordHash = await bcrypt.hash(password, 12);

  // Remove users from the earlier 6-role seed (roles no longer exist).
  const legacy = await UserModel.deleteMany({ role: { $nin: ['admin', 'customer', 'partner'] } });
  if (legacy.deletedCount) console.log(`  removed ${legacy.deletedCount} users with retired roles`);

  for (const u of SEED_USERS) {
    await UserModel.updateOne(
      { email: u.email },
      { $set: { ...u, passwordHash, status: 'active', failedLogins: 0 }, $unset: { lockedUntil: 1 } },
      { upsert: true },
    );
    console.log(`  ${u.role.padEnd(14)} ${u.email}`);
  }
  console.log(`\nSeeded ${SEED_USERS.length} users. Password: ${password}`);
  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect();
  process.exit(1);
});
