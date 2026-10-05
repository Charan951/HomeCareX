/**
 * Seed catalog. Service + add-on ids are identical to the placeholder in bookings.constants.ts
 * (BOOKINGS_SERVICE_CATALOG), so existing bookings and the booking flow keep resolving.
 */
const C = (n: number) => `650000000000000000000a0${n}`;

export const SEED_SERVICES = [
  { id: '650000000000000000000001', categoryId: C(1), slug: 'deep-home-cleaning', name: 'Deep Home Cleaning', basePrice: 1499, durationMinutes: 180,
    description: 'Top-to-bottom cleaning of floors, kitchen, bathrooms, windows and fittings.',
    addOns: [{ id: '650000000000000000000101', name: 'Deep Cleaning', price: 150 }, { id: '650000000000000000000102', name: 'Eco-friendly Chemicals', price: 50 }, { id: '650000000000000000000103', name: 'Post-service Sanitization', price: 100 }] },
  { id: '650000000000000000000004', categoryId: C(1), slug: 'sofa-carpet-shampooing', name: 'Sofa & Carpet Shampooing', basePrice: 899, durationMinutes: 90,
    description: 'Machine shampooing and vacuuming for sofas and carpets.',
    addOns: [{ id: '650000000000000000000401', name: 'Stain Treatment', price: 120 }] },
  { id: '650000000000000000000002', categoryId: C(2), slug: 'ac-service-gas-refill', name: 'AC Service & Gas Refill', basePrice: 599, durationMinutes: 60,
    description: 'Jet-wash service of indoor and outdoor units with a cooling check.',
    addOns: [{ id: '650000000000000000000201', name: 'Gas Top-up', price: 400 }, { id: '650000000000000000000202', name: 'Filter Replacement', price: 250 }] },
  { id: '650000000000000000000005', categoryId: C(2), slug: 'ro-water-purifier-service', name: 'RO/Water Purifier Service', basePrice: 399, durationMinutes: 45,
    description: 'Filter check, membrane flush and TDS test for RO purifiers.',
    addOns: [{ id: '650000000000000000000501', name: 'Filter Change', price: 300 }] },
  { id: '650000000000000000000006', categoryId: C(3), slug: 'at-home-spa-women', name: 'At-Home Spa for Women', basePrice: 1299, durationMinutes: 120,
    description: 'Relaxing spa session by a trained therapist, at home.',
    addOns: [{ id: '650000000000000000000601', name: 'Aromatherapy Oils', price: 200 }] },
  { id: '650000000000000000000003', categoryId: C(4), slug: 'electrician-visit-general', name: 'Electrician Visit (General)', basePrice: 249, durationMinutes: 30,
    description: 'Visit and diagnosis for switches, wiring, fans and minor electrical faults.',
    addOns: [{ id: '650000000000000000000301', name: 'Fixture Installation', price: 199 }] },
  { id: '650000000000000000000007', categoryId: C(5), slug: 'room-painting', name: 'Room Painting (per room)', basePrice: 3499, durationMinutes: 480,
    description: 'Interior wall painting with furniture covering and clean-up.',
    addOns: [{ id: '650000000000000000000701', name: 'Wall Putty & Primer', price: 800 }] },
  { id: '650000000000000000000008', categoryId: C(6), slug: 'general-pest-control', name: 'General Pest Control', basePrice: 799, durationMinutes: 60,
    description: 'Odourless spray treatment for cockroaches, ants and common household pests.',
    addOns: [{ id: '650000000000000000000801', name: 'Termite Treatment', price: 600 }] },
  { id: '650000000000000000000009', categoryId: C(7), slug: 'furniture-assembly', name: 'Furniture Assembly', basePrice: 349, durationMinutes: 60,
    description: 'Assembly of beds, wardrobes, tables and shelves.',
    addOns: [{ id: '650000000000000000000901', name: 'Wall Mounting', price: 150 }] },
] as const;

export const SERVICES_CONSTANTS = { SEED_SERVICES };
