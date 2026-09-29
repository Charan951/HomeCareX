/**
 * Creates an admin, or turns an existing account into one, and resets its password.
 *   npm run create:admin --workspace=backend -- you@example.com "YourPassword1" "Your Name"
 */
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { UserModel } from '../models/User';

dotenv.config();

async function main() {
  const [emailArg, password, name = 'HomeCareX Admin'] = process.argv.slice(2);
  if (!emailArg || !password) throw new Error('Usage: npm run create:admin -- <email> <password> [name]');
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not set.');
  const email = emailArg.trim().toLowerCase();

  await mongoose.connect(process.env.DATABASE_URL);
  await UserModel.updateOne(
    { email },
    {
      $set: { email, role: 'admin', status: 'active', failedLogins: 0, passwordHash: await bcrypt.hash(password, 12) },
      $setOnInsert: { name },
      $unset: { lockedUntil: 1 },
    },
    { upsert: true },
  );
  const user = await UserModel.findOne({ email });
  console.log(`OK: ${user?.email} is now role="${user?.role}"`);
  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error(err.message || err);
  await mongoose.disconnect();
  process.exit(1);
});
