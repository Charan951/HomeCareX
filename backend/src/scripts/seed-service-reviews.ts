/**
 * Seeds demo reviews on a few launch services so the Service Details page and
 * GET /services/:id/reviews have data. Safe to re-run: each review is upserted by (service, customer, message).
 *   npm run seed:catalog --workspace=backend          (services first)
 *   npm run seed:users --workspace=backend            (needs a customer user)
 *   npm run seed:service-reviews --workspace=backend
 * Dev / staging only. Includes one pending and one rejected review that must NOT show on the public page.
 */
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { ReviewModel } from '../models/Review';
import { ServiceModel } from '../models/Service';
import { UserModel } from '../models/User';

dotenv.config();

type Status = 'approved' | 'pending' | 'rejected';
interface DemoReview { slug: string; name: string; rating: number; message: string; verified: boolean; status: Status; daysAgo: number }

const DEMO_REVIEWS: DemoReview[] = [
  { slug: 'deep-home-cleaning', name: 'Ananya Rao', rating: 5, message: 'The team was on time and the flat looked brand new. Kitchen and bathrooms were spotless.', verified: true, status: 'approved', daysAgo: 2 },
  { slug: 'deep-home-cleaning', name: 'Vikram Singh', rating: 4, message: 'Very thorough work overall. Balcony needed a little extra attention but they fixed it quickly.', verified: true, status: 'approved', daysAgo: 6 },
  { slug: 'deep-home-cleaning', name: 'Meera Nair', rating: 5, message: 'Polite professionals and no mess left behind. Will book again before the festive season.', verified: false, status: 'approved', daysAgo: 11 },
  { slug: 'deep-home-cleaning', name: 'Rohit Verma', rating: 3, message: 'Good cleaning but they arrived a little later than the slot I had picked for the visit.', verified: true, status: 'approved', daysAgo: 20 },
  { slug: 'deep-home-cleaning', name: 'Pending Person', rating: 5, message: 'This one is still waiting for moderation and must stay hidden from the public page.', verified: true, status: 'pending', daysAgo: 1 },
  { slug: 'deep-home-cleaning', name: 'Rejected Person', rating: 1, message: 'This one was rejected by an admin and must never be visible on the public page.', verified: false, status: 'rejected', daysAgo: 3 },
  { slug: 'ac-service-gas-refill', name: 'Sandeep Kumar', rating: 5, message: 'AC is cooling much better after the jet wash. The technician explained everything clearly.', verified: true, status: 'approved', daysAgo: 4 },
  { slug: 'ac-service-gas-refill', name: 'Priya Iyer', rating: 4, message: 'Quick and tidy service. They covered the floor before starting and cleaned up afterwards.', verified: true, status: 'approved', daysAgo: 9 },
  { slug: 'at-home-spa-for-women', name: 'Kavitha Reddy', rating: 5, message: 'Very relaxing session and the therapist was professional and friendly throughout the visit.', verified: true, status: 'approved', daysAgo: 5 },
  { slug: 'general-pest-control', name: 'Imran Shaikh', rating: 4, message: 'No smell and the cockroaches were gone within a few days. Clear instructions were given.', verified: true, status: 'approved', daysAgo: 8 },
  { slug: 'mens-haircut-grooming', name: 'Arjun Das', rating: 5, message: 'Neat haircut and beard trim at home. Saved me a trip and the barber was very skilled.', verified: false, status: 'approved', daysAgo: 7 },
];

async function main() {
  if (process.env.NODE_ENV === 'production') throw new Error('Refusing to seed demo reviews in production.');
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set (see backend/.env.example).');
  await mongoose.connect(url);

  const customer = await UserModel.findOne({ role: 'customer' }, '_id email').lean();
  if (!customer) throw new Error('No customer user found. Run: npm run seed:users --workspace=backend');
  const services = await ServiceModel.find({ slug: { $in: [...new Set(DEMO_REVIEWS.map((r) => r.slug))] } }, '_id slug').lean();
  const idBySlug = new Map(services.map((s) => [s.slug, s._id]));

  let upserted = 0;
  for (const r of DEMO_REVIEWS) {
    const serviceId = idBySlug.get(r.slug);
    if (!serviceId) {
      console.log(`  skipped ${r.slug} (service not found; run seed:catalog first)`);
      continue;
    }
    const createdAt = new Date(Date.now() - r.daysAgo * 24 * 60 * 60 * 1000);
    await ReviewModel.updateOne(
      { serviceId, customerId: customer._id, message: r.message },
      {
        $setOnInsert: {
          customerName: r.name,
          customerEmail: customer.email,
          rating: r.rating,
          status: r.status,
          // Demo data: real `verified` values come from a completed booking (see ReviewsService).
          verified: r.verified,
          createdAt,
          updatedAt: createdAt,
        },
      },
      { upsert: true, timestamps: false },
    );
    upserted += 1;
  }
  console.log(`Demo reviews ready: ${upserted} across ${idBySlug.size} services.`);
  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect();
  process.exit(1);
});
