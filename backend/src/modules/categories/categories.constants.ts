/**
 * The 7 launch categories. Slugs for the first six match scripts/seed-dashboard.ts so both seeds
 * upsert the same documents instead of creating duplicates. Admins add more at runtime via
 * POST /admin/categories; no release needed.
 */
export const SEED_CATEGORIES = [
  { slug: 'home-cleaning', name: 'Home Cleaning', icon: '🧹', description: 'Deep cleaning, bathroom, kitchen, sofa & carpet shampooing' },
  { slug: 'appliance-repair', name: 'Appliance Repair & Service', icon: '🔧', description: 'AC, washing machine, refrigerator, RO/water purifier' },
  { slug: 'salon-spa', name: 'Salon & Spa', icon: '💆', description: 'At-home beauty, massage, and grooming for women & men' },
  { slug: 'electrical-plumbing', name: 'Electrical & Plumbing', icon: '💡', description: 'Wiring, fixtures, leak repair, fittings' },
  { slug: 'painting', name: 'Painting & Waterproofing', icon: '🎨', description: 'Interior/exterior painting, damp-proofing' },
  { slug: 'pest-control', name: 'Pest Control', icon: '🐜', description: 'General pest, termite, and mosquito treatments' },
  { slug: 'carpentry', name: 'Carpentry & Furniture Assembly', icon: '🪚', description: 'Furniture assembly, repairs, custom fittings' },
] as const;

export const CATEGORIES_CONSTANTS = { SEED_CATEGORIES };
