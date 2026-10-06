import type { ServiceAvailability } from '../../models/Service';

export interface CatalogSeedService {
  category: string; // category slug (categories.constants.ts SEED_CATEGORIES)
  slug: string;
  name: string;
  basePrice: number;
  durationMinutes: number;
  ratingAvg: number;
  ratingCount: number;
  bookingsCount: number;
  availability: ServiceAvailability;
  description: string;
  addOns?: { name: string; price: number }[];
}

const s = (
  category: string, slug: string, name: string, basePrice: number, durationMinutes: number,
  ratingAvg: number, ratingCount: number, bookingsCount: number, availability: ServiceAvailability,
  description: string, addOns?: CatalogSeedService['addOns'],
): CatalogSeedService => ({ category, slug, name, basePrice, durationMinutes, ratingAvg, ratingCount, bookingsCount, availability, description, addOns });

/**
 * 30 launch services for the public catalog, 4-5 per category. Categories themselves come from
 * categories.constants.ts (fixed ids). Where a slug matches a services.constants.ts seed, that document
 * is kept and only gains the catalog stats below.
 */
export const CATALOG_SEED_SERVICES: CatalogSeedService[] = [
  // Home Cleaning
  s('home-cleaning', 'deep-home-cleaning', 'Deep Home Cleaning', 1499, 180, 4.8, 2140, 900, 'tomorrow', 'Top-to-bottom cleaning of floors, kitchen, bathrooms, windows and fittings.', [{ name: 'Eco-friendly Chemicals', price: 50 }, { name: 'Post-service Sanitization', price: 100 }]),
  s('home-cleaning', 'sofa-carpet-shampooing', 'Sofa & Carpet Shampooing', 899, 90, 4.7, 980, 400, 'today', 'Machine shampooing and vacuuming for sofas and carpets.', [{ name: 'Stain Treatment', price: 120 }]),
  s('home-cleaning', 'bathroom-deep-cleaning', 'Bathroom Deep Cleaning', 599, 60, 4.6, 1320, 650, 'today', 'Descaling of tiles, taps and fittings with disinfectant finish.'),
  s('home-cleaning', 'kitchen-deep-cleaning', 'Kitchen Deep Cleaning', 1199, 120, 4.7, 1050, 520, 'tomorrow', 'Chimney, hob, cabinets and tiles degreased and sanitised.'),
  s('home-cleaning', 'full-home-sanitization', 'Full Home Sanitization', 999, 75, 4.5, 610, 240, 'scheduled', 'Odourless disinfectant spray across rooms, handles and furniture.'),
  // Appliance Repair & Service
  s('appliance-repair-service', 'ac-service-gas-refill', 'AC Service & Gas Refill', 599, 60, 4.6, 3210, 1200, 'today', 'Jet-wash service of indoor and outdoor units with a cooling check.', [{ name: 'Gas Top-up', price: 400 }, { name: 'Filter Replacement', price: 250 }]),
  s('appliance-repair-service', 'ro-water-purifier-service', 'RO/Water Purifier Service', 399, 45, 4.5, 1120, 500, 'today', 'Filter check, membrane flush and TDS test for RO purifiers.', [{ name: 'Filter Change', price: 300 }]),
  s('appliance-repair-service', 'washing-machine-repair', 'Washing Machine Repair', 349, 60, 4.4, 890, 380, 'tomorrow', 'Diagnosis and repair for front-load and top-load machines.'),
  s('appliance-repair-service', 'refrigerator-repair', 'Refrigerator Repair', 449, 60, 4.5, 760, 310, 'tomorrow', 'Cooling, compressor and door-seal checks with on-spot repair.'),
  s('appliance-repair-service', 'microwave-oven-repair', 'Microwave Oven Repair', 299, 45, 4.3, 340, 120, 'scheduled', 'Fault diagnosis and repair for solo, grill and convection ovens.'),
  // Salon & Spa
  s('salon-spa', 'at-home-spa-for-women', 'At-Home Spa for Women', 1299, 120, 4.9, 1560, 700, 'tomorrow', 'Relaxing spa session by a trained therapist, at home.', [{ name: 'Aromatherapy Oils', price: 200 }]),
  s('salon-spa', 'mens-haircut-grooming', "Men's Haircut & Grooming", 399, 45, 4.6, 1480, 810, 'today', 'Haircut, beard trim and head massage at your doorstep.'),
  s('salon-spa', 'full-body-massage', 'Full Body Massage', 1499, 90, 4.8, 1190, 560, 'tomorrow', 'Swedish or deep-tissue massage by a certified therapist.'),
  s('salon-spa', 'bridal-makeup', 'Bridal Makeup', 4999, 180, 4.9, 210, 70, 'scheduled', 'Complete bridal makeup and hairstyling by a senior artist.'),
  // Electrical & Plumbing
  s('electrical-plumbing', 'electrician-visit-general', 'Electrician Visit (General)', 249, 30, 4.4, 870, 350, 'today', 'Visit and diagnosis for switches, wiring, fans and minor electrical faults.', [{ name: 'Fixture Installation', price: 199 }]),
  s('electrical-plumbing', 'fan-light-installation', 'Fan & Light Installation', 299, 30, 4.5, 720, 300, 'today', 'Ceiling fan, tube light and decorative light fitting.'),
  s('electrical-plumbing', 'plumbing-tap-leak-repair', 'Plumbing – Tap & Leak Repair', 299, 45, 4.6, 640, 300, 'today', 'Tap, pipe and flush-tank leak repair with spare fitting.'),
  s('electrical-plumbing', 'geyser-installation-repair', 'Geyser Installation & Repair', 449, 60, 4.4, 430, 170, 'tomorrow', 'Install, replace or repair electric and gas geysers.'),
  s('electrical-plumbing', 'water-tank-cleaning', 'Water Tank Cleaning', 799, 90, 4.5, 390, 160, 'scheduled', 'Mechanised scrubbing and disinfection of overhead and sump tanks.'),
  // Painting & Waterproofing
  s('painting-waterproofing', 'room-painting-per-room', 'Room Painting (per room)', 3499, 480, 4.6, 430, 150, 'scheduled', 'Interior wall painting with furniture covering and clean-up.', [{ name: 'Wall Putty & Primer', price: 800 }]),
  s('painting-waterproofing', 'terrace-waterproofing', 'Terrace Waterproofing', 7999, 600, 4.4, 150, 45, 'scheduled', 'Crack filling and waterproof coating for terraces and roofs.'),
  s('painting-waterproofing', 'texture-accent-wall', 'Texture Accent Wall', 2499, 300, 4.7, 180, 60, 'scheduled', 'Designer texture finish on a single feature wall.'),
  // Pest Control
  s('pest-control', 'general-pest-control', 'General Pest Control', 799, 60, 4.5, 1980, 600, 'tomorrow', 'Odourless spray treatment for cockroaches, ants and common household pests.', [{ name: 'Termite Treatment', price: 600 }]),
  s('pest-control', 'termite-treatment', 'Termite Treatment', 1999, 120, 4.4, 310, 90, 'scheduled', 'Drill-and-inject anti-termite treatment with 1-year warranty.'),
  s('pest-control', 'mosquito-fogging', 'Mosquito Fogging', 499, 30, 4.2, 420, 210, 'today', 'Thermal fogging for homes, balconies and gardens.'),
  s('pest-control', 'bed-bug-treatment', 'Bed Bug Treatment', 1299, 90, 4.6, 260, 100, 'tomorrow', 'Two-step heat and spray treatment for beds, sofas and wardrobes.'),
  // Carpentry & Furniture Assembly
  s('carpentry-furniture-assembly', 'furniture-assembly', 'Furniture Assembly', 349, 60, 4.5, 560, 260, 'tomorrow', 'Assembly of beds, wardrobes, tables and shelves.', [{ name: 'Wall Mounting', price: 150 }]),
  s('carpentry-furniture-assembly', 'door-lock-repair', 'Door & Lock Repair', 299, 45, 4.4, 480, 220, 'today', 'Hinge, handle and lock repair or replacement.'),
  s('carpentry-furniture-assembly', 'wardrobe-repair', 'Wardrobe & Drawer Repair', 399, 60, 4.3, 250, 90, 'tomorrow', 'Channel, hinge and shutter alignment for wardrobes and drawers.'),
  s('carpentry-furniture-assembly', 'custom-shelf-installation', 'Shelf & Curtain Rod Installation', 349, 45, 4.5, 330, 140, 'today', 'Drill-and-fix wall shelves, curtain rods and TV brackets.'),
];
