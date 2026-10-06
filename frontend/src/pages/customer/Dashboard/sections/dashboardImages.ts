/**
 * Photos for the dashboard's category tiles and service cards.
 * Web-sized copies live in /public/images/dashboard (the originals in /public/images stay untouched).
 * Anything not listed here falls back to the 3D icon, so a new category or service never renders empty.
 */
export interface DashboardPhoto {
  src: string;
  /** CSS object-position — keeps the subject in frame when the image is cropped to the card. */
  position: string;
}

const img = (file: string, position = "50% 50%"): DashboardPhoto => ({
  src: `${import.meta.env.BASE_URL}images/${file}`,
  position,
});

/** Keyed by category slug. Tall tiles, so positions are tuned for a portrait crop. */
const CATEGORY_PHOTOS: Record<string, DashboardPhoto> = {
  "home-cleaning": img("home-cleaning.jpg"),
  "appliance-repair": img("appliance-repair.jpg", "58% 50%"),
  "salon-spa": img("Home-spa-women.png", "50% 34%"),
  "electrical-plumbing": img("electrical.jpg"),
  "painting": img("painting-category.png", "50% 45%"),
  "pest-control": img("pest-control-clean.png"),
  "carpentry": img("home-maintenance.jpg"),
};

const PHOTOGRAPHED = [
  "bathroom-deep-cleaning", "kitchen-deep-cleaning", "full-home-sanitization", "washing-machine-repair",
  "refrigerator-repair", "microwave-oven-repair", "geyser-installation-repair", "water-tank-cleaning",
  "room-painting-per-room", "terrace-waterproofing", "texture-accent-wall", "mosquito-fogging",
  "bed-bug-treatment", "mens-haircut-grooming", "bridal-makeup", "full-body-massage",
];
/** Keyed by service slug. Wide crops, so these differ from the category crops on purpose. */
const SERVICE_PHOTOS: Record<string, DashboardPhoto> = {
  "ac-service-gas-refill": img("appliance-repair.jpg", "12% 50%"),
  "ro-water-purifier-service": img("plumbing.jpg", "50% 72%"),
  "deep-home-cleaning": img("home-cleaning.jpg"),
  "sofa-carpet-shampooing": img("home-cleaning.jpg"),
  "at-home-spa-for-women": img("Home-spa-women.png", "50% 40%"),
  "electrician-visit-general": img("electrical.jpg"),
  "plumbing-tap-leak-repair": img("plumbing.jpg", "50% 72%"),
  "room-painting-per-room": img("painting-category.png", "50% 45%"),
  "general-pest-control": img("pest-control-clean.png"),
  "termite-treatment": img("termite-treatment-clean.png"),
  "furniture-assembly": img("home-maintenance.jpg"),
      ...Object.fromEntries(PHOTOGRAPHED.map((slug) => [slug,img(`${slug}.png`)])),

};

export const categoryPhoto = (slug: string): DashboardPhoto | undefined => CATEGORY_PHOTOS[slug];
export const servicePhoto = (slug: string): DashboardPhoto | undefined => SERVICE_PHOTOS[slug];

/** Square thumbnails need a different focal point than the wide service cards. */
const THUMB_POSITIONS: Record<string, string> = {
  "ac-service-gas-refill": "58% 50%",
  "ro-water-purifier-service": "50% 60%",
  "plumbing-tap-leak-repair": "50% 60%",
  "at-home-spa-for-women": "30% 38%",
  "general-pest-control": "50% 50%",
};

/** Bookings only carry a service name, so match on its slug first, then on keywords. */
const KEYWORD_PHOTOS: [RegExp, string][] = [
  [/termite/, "termite"],
  [/pest|cockroach|rodent|mosquito/, "general-pest-control"],
  [/\bspa\b|massage|facial|salon/, "at-home-spa-for-women"],
  [/paint|waterproof/, "room-painting-per-room"],
  [/electric|wiring|switch|fan/, "electrician-visit-general"],
  [/plumb|tap|leak|pipe|geyser|tank/, "plumbing-tap-leak-repair"],
  [/sofa|carpet|shampoo/, "sofa-carpet-shampooing"],
  [/clean|sanitiz/, "deep-home-cleaning"],
  [/\b(ac|appliance|refrigerator|washing|microwave)\b|repair/, "ac-service-gas-refill"],
  [/carpent|furniture|wardrobe|shelf|lock/, "furniture-assembly"],
];

const slugify = (name: string) =>
  name
    .toLowerCase()
    .replace(/&/g, " ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/** Photo for a booking row (square thumbnail), or undefined so the caller can show the 3D icon. */
export function bookingPhoto(serviceName: string): DashboardPhoto | undefined {
  const slug = slugify(serviceName);
  let key = SERVICE_PHOTOS[slug] ? slug : undefined;
  if (!key) {
    const text = serviceName.toLowerCase();
    key = KEYWORD_PHOTOS.find(([re]) => re.test(text))?.[1];
  }
  const photo = key ? SERVICE_PHOTOS[key] : undefined;
  if (!photo || !key) return undefined;
  return { ...photo, position: THUMB_POSITIONS[key] ?? photo.position };
}
