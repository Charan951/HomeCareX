import { useState } from "react";
import clsx from "clsx";

/**
 * Shared look for the Categories and Services pages: a soft pastel tile + a 3D (Fluent) emoji per
 * category / service. Images load from the jsDelivr CDN; if one fails (offline, blocked, wrong
 * name) the plain emoji from the data is shown instead, so a card never has a broken image.
 */
const CDN = "https://cdn.jsdelivr.net/gh/microsoft/fluentui-emoji@main/assets/";

export interface Visual {
  /** Path under the Fluent emoji assets folder, without ".png". */
  asset: string;
  /** Tailwind background class for the pastel tile. */
  tint: string;
  /** Optional local image from /public/images. If absent, the Fluent 3D icon is used. */
  image?: string;
  /** CSS object-position for the photo when it is cropped (default: centre). */
  focus?: string;
}

const T = {
  indigo: "bg-[#ECEBFB]",
  peach: "bg-[#FFEADB]",
  mint: "bg-[#E4F4EC]",
  sun: "bg-[#FFF3C9]",
  rose: "bg-[#FDE7F0]",
  sky: "bg-[#E3F0FC]",
  sand: "bg-[#F4ECDF]",
};

export const CATEGORY_VISUALS: Record<string, Visual> = {
  "home-cleaning": { asset: "Broom/3D/broom_3d", tint: T.indigo, image: "/images/home-cleaning.jpg" },
  "appliance-repair": { asset: "Wrench/3D/wrench_3d", tint: T.peach, image: "/images/appliance-repair.jpg" },
  "salon-spa": { asset: "Person%20getting%20massage/Default/3D/person_getting_massage_3d_default", tint: T.rose, image: "/images/Home-spa-women.png" },
  "electrical-plumbing": { asset: "Light%20bulb/3D/light_bulb_3d", tint: T.sun, image: "/images/electrical.jpg" },
  painting: { asset: "Paintbrush/3D/paintbrush_3d", tint: T.sky, image: "/images/painting-category.png" },
  "pest-control": { asset: "Bug/3D/bug_3d", tint: T.mint, image: "/images/pest-control-clean.png", focus: "60% 50%" },
  carpentry: { asset: "Carpentry%20saw/3D/carpentry_saw_3d", tint: T.sand, image: "/images/home-maintenance.jpg" },
};

/** Service-specific icons (by slug); anything not listed falls back to its category's icon (keyed by category slug; admin-added categories get the sparkles fallback + their own emoji). */
const SERVICE_ASSETS: Record<string, string> = {
  "ac-service-gas-refill": "Snowflake/3D/snowflake_3d",
  "ro-water-purifier-service": "Droplet/3D/droplet_3d",
  "electrician-visit-general": "Electric%20plug/3D/electric_plug_3d",
  "sofa-carpet-shampooing": "Couch%20and%20lamp/3D/couch_and_lamp_3d",
};

/** Real photographs (public/images). */
const PHOTO = {
  clean: "/images/home-cleaning.jpg",
  appliance: "/images/appliance-repair.jpg",
  electrical: "/images/electrical.jpg",
  plumbing: "/images/plumbing.jpg",
  carpentry: "/images/home-maintenance.jpg",
  pest: "/images/pest-control-clean.png",
  termite: "/images/termite-treatment-clean.png",
  spa: "/images/Home-spa-women.png",
};

const PHOTOGRAPHED = [
  "bathroom-deep-cleaning", "kitchen-deep-cleaning", "full-home-sanitization", "washing-machine-repair",
  "refrigerator-repair", "microwave-oven-repair", "geyser-installation-repair", "water-tank-cleaning",
  "room-painting-per-room", "terrace-waterproofing", "texture-accent-wall", "mosquito-fogging",
  "bed-bug-treatment", "mens-haircut-grooming", "bridal-makeup", "full-body-massage",
];
/** Drawn illustrations (public/images/catalog/<slug>.svg) for services that have no suitable photograph yet. */
const ILLUSTRATED :string[] = [];

/**
 * Per-service image: a photo where one fits, otherwise the illustration. To upgrade an illustration
 * to a real photo, drop the file into public/images and point its slug here (see public/images/catalog/README.md).
 */
const SERVICE_IMAGES: Record<string, string> = {
  ...Object.fromEntries(ILLUSTRATED.map((slug) => [slug, `/images/catalog/${slug}.svg`])),
    ...Object.fromEntries(PHOTOGRAPHED.map((slug) => [slug, `/images/${slug}.png`])),

  "deep-home-cleaning": PHOTO.clean,
  "sofa-carpet-shampooing": PHOTO.clean,
  "ac-service-gas-refill": PHOTO.appliance,
  "ro-water-purifier-service": PHOTO.appliance,
  "electrician-visit-general": PHOTO.electrical,
  "fan-light-installation": PHOTO.electrical,
  "plumbing-tap-leak-repair": PHOTO.plumbing,
  "furniture-assembly": PHOTO.carpentry,
  "door-lock-repair": PHOTO.carpentry,
  "wardrobe-repair": PHOTO.carpentry,
  "custom-shelf-installation": PHOTO.carpentry,
  "general-pest-control": PHOTO.pest,
  "termite-treatment": PHOTO.termite,
  "at-home-spa-for-women": PHOTO.spa,
};

/** Crop anchor (CSS object-position) per service image, for photos whose subject is off-centre or has text baked in. */
const SERVICE_FOCUS: Record<string, string> = {
  [PHOTO.appliance]: "50% 22%",
  [PHOTO.plumbing]: "50% 40%",
  [PHOTO.electrical]: "35% 50%",
  [PHOTO.spa]: "50% 26%",
  [PHOTO.pest]: "50% 50%",
  [PHOTO.termite]: "14% 50%",
  [PHOTO.carpentry]: "50% 65%",
};

const FALLBACK: Visual = { asset: "Sparkles/3D/sparkles_3d", tint: T.indigo };

export const categoryVisual = (categorySlug: string): Visual => CATEGORY_VISUALS[categorySlug] ?? FALLBACK;

export const serviceVisual = (slug: string, categorySlug: string): Visual => {
  const base = categoryVisual(categorySlug);
  const image = SERVICE_IMAGES[slug] ?? base.image;
  // Use the category's crop only when the service shows the same photo as its category.
  const focus = image === base.image ? base.focus : image ? SERVICE_FOCUS[image] : undefined;
  return { ...base, asset: SERVICE_ASSETS[slug] ?? base.asset, image, focus };
};

interface Icon3DProps {
  asset: string;
  /** Emoji shown if the 3D image can't load. */
  emoji?: string;
  className?: string;
  /** Stagger the float animation so a grid of icons doesn't bob in sync. */
  delayMs?: number;
}

export function Icon3D({ asset, emoji, className, delayMs = 0 }: Icon3DProps) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <span aria-hidden="true" className={clsx("flex items-center justify-center text-4xl", className)}>
        {emoji ?? "✨"}
      </span>
    );
  }
  return (
    <img
      src={`${CDN}${asset}.png`}
      alt=""
      loading="lazy"
      decoding="async"
      draggable={false}
      onError={() => setFailed(true)}
      style={{ animationDelay: `${-delayMs}ms` }}
      className={clsx("float-3d object-contain drop-shadow-[0_8px_8px_rgba(30,27,46,.25)]", className)}
    />
  );
}

export const formatPrice = (n: number) => `₹${n.toLocaleString("en-IN")}`;
