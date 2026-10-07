import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { upsertCatalogSeed } from '../modules/catalog/catalog.seed';

dotenv.config();

async function main() {
  if (process.env.NODE_ENV === 'production') throw new Error('Refusing to seed demo catalog in production.');
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set (see backend/.env.example).');
  await mongoose.connect(url);
  await Promise.all([mongoose.model('Service').syncIndexes(), mongoose.model('Category').syncIndexes()]);
  const refreshMedia = process.argv.includes('--refresh-media');
  const r = await upsertCatalogSeed({ refreshMedia });
  console.log(`Catalog ready: ${r.categories} categories, ${r.services} services.${refreshMedia ? ' Service galleries were reset to the seed photos.' : ''}`);
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
