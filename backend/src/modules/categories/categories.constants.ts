/** Fixed ids so the seeded catalog lines up with the placeholder in bookings.constants.ts. */
export const SEED_CATEGORIES = [
  { id: '650000000000000000000a01', name: 'Home Cleaning', slug: 'home-cleaning', icon: '🧹', description: 'Deep cleaning, bathroom, kitchen, sofa & carpet shampooing' },
  { id: '650000000000000000000a02', name: 'Appliance Repair & Service', slug: 'appliance-repair-service', icon: '🔧', description: 'AC, washing machine, refrigerator, RO/water purifier' },
  { id: '650000000000000000000a03', name: 'Salon & Spa', slug: 'salon-spa', icon: '💆', description: 'At-home beauty, massage, and grooming for women & men' },
  { id: '650000000000000000000a04', name: 'Electrical & Plumbing', slug: 'electrical-plumbing', icon: '💡', description: 'Wiring, fixtures, leak repair, fittings' },
  { id: '650000000000000000000a05', name: 'Painting & Waterproofing', slug: 'painting-waterproofing', icon: '🎨', description: 'Interior/exterior painting, damp-proofing' },
  { id: '650000000000000000000a06', name: 'Pest Control', slug: 'pest-control', icon: '🐜', description: 'General pest, termite, and mosquito treatments' },
  { id: '650000000000000000000a07', name: 'Carpentry & Furniture Assembly', slug: 'carpentry-furniture-assembly', icon: '🪚', description: 'Furniture assembly, repairs, custom fittings' },
] as const;

export const CATEGORIES_CONSTANTS = { SEED_CATEGORIES };
