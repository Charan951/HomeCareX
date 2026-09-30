/**
 * Step 1 mock catalog — same ids/prices as the backend's placeholder catalog
 * (backend/src/modules/bookings/bookings.constants.ts) so a real API swap later is a drop-in.
 * "Step 1 works on mock" per today's acceptance criteria; GET /services/:id/slots is already real.
 */
export interface MockAddOn { id: string; name: string; price: number }
export interface MockService { id: string; slug: string; name: string; basePrice: number; addOns: MockAddOn[] }

export const MOCK_SERVICE_CATALOG: MockService[] = [
  {
    id: "650000000000000000000001",
    slug: "deep-home-cleaning",
    name: "Deep Home Cleaning",
    basePrice: 1499,
    addOns: [
      { id: "650000000000000000000101", name: "Deep Cleaning", price: 150 },
      { id: "650000000000000000000102", name: "Eco-friendly Chemicals", price: 50 },
      { id: "650000000000000000000103", name: "Post-service Sanitization", price: 100 },
    ],
  },
  {
    id: "650000000000000000000002",
    slug: "ac-service-gas-refill",
    name: "AC Service & Gas Refill",
    basePrice: 599,
    addOns: [
      { id: "650000000000000000000201", name: "Gas Top-up", price: 400 },
      { id: "650000000000000000000202", name: "Filter Replacement", price: 250 },
    ],
  },
  {
    id: "650000000000000000000003",
    slug: "electrician-visit-general",
    name: "Electrician Visit (General)",
    basePrice: 249,
    addOns: [{ id: "650000000000000000000301", name: "Fixture Installation", price: 199 }],
  },
  {
    id: "650000000000000000000004",
    slug: "sofa-carpet-shampooing",
    name: "Sofa & Carpet Shampooing",
    basePrice: 899,
    addOns: [{ id: "650000000000000000000401", name: "Stain Treatment", price: 120 }],
  },
  {
    id: "650000000000000000000005",
    slug: "ro-water-purifier-service",
    name: "RO/Water Purifier Service",
    basePrice: 399,
    addOns: [{ id: "650000000000000000000501", name: "Filter Change", price: 300 }],
  },
  {
    id: "650000000000000000000006",
    slug: "at-home-spa-women",
    name: "At-Home Spa for Women",
    basePrice: 1299,
    addOns: [{ id: "650000000000000000000601", name: "Aromatherapy Oils", price: 200 }],
  },
  {
    id: "650000000000000000000007",
    slug: "room-painting",
    name: "Room Painting (per room)",
    basePrice: 3499,
    addOns: [{ id: "650000000000000000000701", name: "Wall Putty & Primer", price: 800 }],
  },
  {
    id: "650000000000000000000008",
    slug: "general-pest-control",
    name: "General Pest Control",
    basePrice: 799,
    addOns: [{ id: "650000000000000000000801", name: "Termite Treatment", price: 600 }],
  },
  {
    id: "650000000000000000000009",
    slug: "furniture-assembly",
    name: "Furniture Assembly",
    basePrice: 349,
    addOns: [{ id: "650000000000000000000901", name: "Wall Mounting", price: 150 }],
  },
];

export function findMockServiceBySlug(slug: string | undefined): MockService | undefined {
  return MOCK_SERVICE_CATALOG.find((s) => s.slug === slug);
}