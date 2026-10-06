import React, { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  Clock,
  Headphones,
  ShieldCheck,
  Star,
  X,
  ZoomIn,
} from "lucide-react";

interface Service {
  id: string;
  image: string;
  category: string;
  name: string;
  rating: number;
  price: number;
  duration: string;
  description: string;
}

const services: Service[] = [
  {
    id: "SERVICE001",
    image: "/images/home-cleaning.jpg",
    category: "Cleaning",
    name: "Home Cleaning",
    rating: 4.8,
    price: 499,
    duration: "2-3 hrs",
    description:
      "Professional home cleaning service to keep your home fresh, clean and comfortable.",
  },
  {
    id: "SERVICE002",
    image: "/images/plumbing.jpg",
    category: "Plumbing",
    name: "Plumbing",
    rating: 4.8,
    price: 399,
    duration: "1-2 hrs",
    description:
      "Reliable plumbing services for common household plumbing requirements.",
  },
  {
    id: "SERVICE003",
    image: "/images/electrical.jpg",
    category: "Electrical",
    name: "Electrical Services",
    rating: 4.7,
    price: 349,
    duration: "1-2 hrs",
    description:
      "Professional electrical services for safe and reliable home maintenance.",
  },
  {
    id: "SERVICE004",
    image: "/images/appliance-repair.jpg",
    category: "Appliance",
    name: "Appliance Repair",
    rating: 4.8,
    price: 499,
    duration: "2-3 hrs",
    description:
      "Expert appliance repair services for your everyday household appliances.",
  },
  {
    id: "SERVICE005",
    image: "/images/painting.jpg",
    category: "Painting",
    name: "Home Painting",
    rating: 4.7,
    price: 999,
    duration: "1-2 days",
    description:
      "Give your home a fresh look with our professional home painting service.",
  },
  {
    id: "SERVICE006",
    image: "/images/home-maintenance.jpg",
    category: "Maintenance",
    name: "Home Maintenance",
    rating: 4.8,
    price: 599,
    duration: "2-3 hrs",
    description:
      "Complete home maintenance services to keep your property in excellent condition.",
  },
  {
    id: "SERVICE007",
    image: "/images/deep-cleaning.jpg",
    category: "Cleaning",
    name: "Deep Cleaning",
    rating: 4.9,
    price: 799,
    duration: "3-4 hrs",
    description:
      "Detailed deep cleaning service for a healthier and cleaner home.",
  },
  {
    id: "SERVICE008",
    image: "/images/bathroom-cleaning.jpg",
    category: "Cleaning",
    name: "Bathroom Cleaning",
    rating: 4.8,
    price: 399,
    duration: "1-2 hrs",
    description:
      "Professional bathroom cleaning service for a fresh and hygienic bathroom.",
  },
  {
    id: "SERVICE009",
    image: "/images/kitchen-cleaning.jpg",
    category: "Cleaning",
    name: "Kitchen Cleaning",
    rating: 4.8,
    price: 449,
    duration: "1-2 hrs",
    description:
      "Thorough kitchen cleaning service to keep your cooking space fresh and hygienic.",
  },
];

/*
  Extra photos for each service, shown under the price.
  Only that service's own photos are used. The service's main image
  (from the list above) is always the first photo. All photos are
  shown together as small thumbnails, and clicking one opens it in
  a pop-up viewer.

  To add photos: put the image files in public/images using the
  names below (or change the names to match your files).
  Any file that does not exist is simply skipped.
*/
const serviceGallery: Record<string, string[]> = {
  SERVICE001: [
    "/images/home-cleaning-2.jpg",
    "/images/home-cleaning-3.jpg",
    "/images/home-cleaning-4.jpg",
  ],
  SERVICE002: [
    "/images/plumbing-2.jpg",
    "/images/plumbing-3.jpg",
    "/images/plumbing-4.jpg",
  ],
  SERVICE003: [
    "/images/electrical-2.jpg",
    "/images/electrical-3.jpg",
    "/images/electrical-4.jpg",
  ],
  SERVICE004: [
    "/images/appliance-repair-2.jpg",
    "/images/appliance-repair-3.jpg",
    "/images/appliance-repair-4.jpg",
  ],
  SERVICE005: [
    "/images/painting-2.jpg",
    "/images/painting-3.jpg",
    "/images/painting-4.jpg",
  ],
  SERVICE006: [
    "/images/home-maintenance-2.jpg",
    "/images/home-maintenance-3.jpg",
    "/images/home-maintenance-4.jpg",
  ],
  SERVICE007: [
    "/images/deep-cleaning-2.jpg",
    "/images/deep-cleaning-3.jpg",
    "/images/deep-cleaning-4.jpg",
  ],
  SERVICE008: [
    "/images/bathroom-cleaning-2.jpg",
    "/images/bathroom-cleaning-3.jpg",
    "/images/bathroom-cleaning-4.jpg",
  ],
  SERVICE009: [
    "/images/kitchen-cleaning-2.jpg",
    "/images/kitchen-cleaning-3.jpg",
    "/images/kitchen-cleaning-4.jpg",
  ],
};

const trustPoints = [
  {
    icon: BadgeCheck,
    title: "Verified Professionals",
    text: "Background-checked and trained experts.",
  },
  {
    icon: ShieldCheck,
    title: "Safe & Reliable",
    text: "Quality work you can count on.",
  },
  {
    icon: CalendarCheck,
    title: "Flexible Scheduling",
    text: "Pick a time that suits you.",
  },
  {
    icon: Headphones,
    title: "Customer Support",
    text: "We're here whenever you need help.",
  },
];

const ServiceDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const service = services.find((item) => item.id === id);

  /* ---------- Photos under the price ---------- */

  const [failed, setFailed] = useState<string[]>([]);
  const [lightbox, setLightbox] = useState<number | null>(null);

  const photos = service
    ? [service.image, ...(serviceGallery[service.id] ?? [])]
        .filter((src, index, all) => all.indexOf(src) === index)
        .filter((src) => !failed.includes(src))
    : [];

  const markFailed = (src: string) =>
    setFailed((prev) => (prev.includes(src) ? prev : [...prev, src]));

  // Collapse and reset when the service changes
  useEffect(() => {
    setFailed([]);
    setLightbox(null);
  }, [id]);

  /* ---------- Pop-up viewer (lightbox) ---------- */

  const total = photos.length;

  const lightboxIndex =
    lightbox !== null && total > 0 ? Math.min(lightbox, total - 1) : null;

  const lightboxImage = lightboxIndex !== null ? photos[lightboxIndex] : null;

  const isLightboxOpen = lightbox !== null;

  const showPrev = useCallback(
    () =>
      setLightbox((i) =>
        i === null || total === 0 ? i : (i - 1 + total) % total
      ),
    [total]
  );

  const showNext = useCallback(
    () =>
      setLightbox((i) =>
        i === null || total === 0 ? i : (i + 1) % total
      ),
    [total]
  );

  // Keyboard: Esc closes, arrows move. Page scroll is locked while open.
  useEffect(() => {
    if (!isLightboxOpen) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(null);
      if (e.key === "ArrowLeft") showPrev();
      if (e.key === "ArrowRight") showNext();
    };

    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [isLightboxOpen, showPrev, showNext]);

  if (!service) {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f8f9ff] px-4">
        <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-[#6366f1]/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-[#ff8a3d]/10 blur-3xl" />

        <div className="relative max-w-md rounded-3xl border border-[#e5e7eb] bg-white p-10 text-center shadow-[0_20px_60px_rgba(17,16,79,0.08)]">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#eef2ff] text-3xl">
            🔍
          </div>

          <h1 className="text-2xl font-extrabold text-[#11104f] sm:text-3xl">
            Service Not Found
          </h1>

          <p className="mt-3 text-sm leading-6 text-[#6b6b8a]">
            The service you are looking for does not exist or may have been
            removed.
          </p>

          <Link
            to="/services"
            className="mt-7 inline-flex items-center gap-2 rounded-xl bg-[#4338ca] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-[#4338ca]/25 transition hover:-translate-y-0.5 hover:bg-[#3730a3]"
          >
            <ArrowLeft size={18} />
            Back to Services
          </Link>
        </div>
      </main>
    );
  }

  const related = services
    .filter((item) => item.id !== service.id)
    .sort(
      (a, b) =>
        Number(b.category === service.category) -
        Number(a.category === service.category)
    )
    .slice(0, 3);

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#eef2ff] via-[#f8f9ff] to-white">
      {/* Mobile: tight top padding (pt-1). sm and up: unchanged. */}
      <div className="mx-auto max-w-6xl px-4 pb-3 pt-1 sm:px-6 sm:py-8 lg:px-8 lg:py-12">

        {/* ================= BREADCRUMB ================= */}
        <nav
          aria-label="Breadcrumb"
          className="mb-2 flex flex-wrap items-center gap-1.5 text-sm sm:mb-6"
        >
          <Link
            to="/services"
            className="inline-flex items-center gap-1.5 font-semibold text-[#4338ca] transition hover:text-[#3730a3]"
          >
            <ArrowLeft size={16} />
            Services
          </Link>
          <ChevronRight size={14} className="text-[#b4b4c8]" />
          <span className="text-[#6b6b8a]">{service.category}</span>
          <ChevronRight size={14} className="hidden text-[#b4b4c8] sm:block" />
          <span className="hidden font-semibold text-[#11104f] sm:inline">
            {service.name}
          </span>
        </nav>

        {/* ================= HERO CARD ================= */}
        <div className="grid overflow-hidden rounded-3xl border border-[#e5e7eb] bg-white shadow-[0_20px_60px_rgba(17,16,79,0.08)] sm:rounded-[2rem] lg:grid-cols-2">

          {/* Image */}
          <div className="relative h-48 bg-gradient-to-br from-[#4338ca] to-[#6366f1] sm:h-64 lg:h-auto lg:min-h-[560px]">
            <img
              src={service.image}
              alt={service.name}
              className="absolute inset-0 h-full w-full object-cover"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-[#11104f]/60 via-transparent to-transparent" />
          </div>

          {/* Content */}
          <div className="flex flex-col p-5 sm:p-8 lg:p-10">

            <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-[#11104f] sm:text-4xl">
              {service.name}
            </h1>

            <div className="mt-4 flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <Star
                  key={n}
                  size={18}
                  fill={n <= Math.round(service.rating) ? "#ff8a3d" : "none"}
                  className={
                    n <= Math.round(service.rating)
                      ? "text-[#ff8a3d]"
                      : "text-[#d1d5db]"
                  }
                />
              ))}
              <span className="ml-2 text-sm font-bold text-[#11104f]">
                {service.rating}
              </span>
            </div>

            <p className="mt-5 text-base leading-7 text-[#55556f]">
              {service.description}
            </p>

            {/* Price + Duration */}
            <div className="mt-7 grid grid-cols-2 gap-4">
              <div className="rounded-2xl border border-[#e0e7ff] bg-[#f8f9ff] p-5">
                <p className="text-xs font-bold uppercase tracking-wider text-[#8b8ba7]">
                  Starting from
                </p>
                <p className="mt-1.5 text-3xl font-extrabold text-[#4338ca]">
                  ₹{service.price}
                </p>
              </div>

              <div className="rounded-2xl border border-[#e0e7ff] bg-[#f8f9ff] p-5">
                <p className="text-xs font-bold uppercase tracking-wider text-[#8b8ba7]">
                  Duration
                </p>
                <p className="mt-2 flex items-center gap-2 text-xl font-extrabold text-[#11104f]">
                  <Clock size={20} className="text-[#6366f1]" />
                  {service.duration}
                </p>
              </div>
            </div>

            {/* ================= PHOTOS (under the price) ================= */}
            {photos.length > 0 && (
              <div className="mt-7">

                <p className="mb-3 text-xs font-bold uppercase tracking-wider text-[#8b8ba7]">
                  Photos
                  <span className="ml-1.5 text-[#b4b4c8]">
                    ({photos.length})
                  </span>
                </p>

                {/* All photos visible at once, small size */}
                <div className="grid grid-cols-4 gap-2.5 sm:gap-3">
                  {photos.map((src, index) => (
                    <button
                      key={src}
                      type="button"
                      onClick={() => setLightbox(index)}
                      aria-label={`Open photo ${index + 1} of ${total}`}
                      className="group relative aspect-square cursor-zoom-in overflow-hidden rounded-xl border border-[#e0e7ff] bg-[#eef2ff] shadow-sm transition hover:-translate-y-0.5 hover:border-[#6366f1] hover:shadow-md focus:outline-none focus-visible:ring-4 focus-visible:ring-[#6366f1]/20"
                    >
                      <img
                        src={src}
                        alt={`${service.name} photo ${index + 1}`}
                        onError={() => markFailed(src)}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
                      />

                      <span className="absolute inset-0 flex items-center justify-center bg-[#11104f]/0 text-white transition group-hover:bg-[#11104f]/35">
                        <ZoomIn
                          size={18}
                          className="opacity-0 transition group-hover:opacity-100"
                        />
                      </span>
                    </button>
                  ))}
                </div>

              </div>
            )}

            {/* Trust points */}
            <ul className="mt-7 grid gap-4 border-t border-[#f0f0f7] pt-7 sm:grid-cols-2">
              {trustPoints.map(({ icon: Icon, title, text }) => (
                <li key={title} className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eef2ff] text-[#4338ca]">
                    <Icon size={20} />
                  </span>
                  <span>
                    <span className="block text-sm font-bold text-[#11104f]">
                      {title}
                    </span>
                    <span className="block text-xs leading-5 text-[#6b6b8a]">
                      {text}
                    </span>
                  </span>
                </li>
              ))}
            </ul>

            {/* Book */}
            <div className="mt-auto pt-8">
              <button
                type="button"
                className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-[#ff8a3d] px-6 py-4 text-base font-bold text-white shadow-lg shadow-[#ff8a3d]/30 transition hover:-translate-y-0.5 hover:bg-[#f5731f] hover:shadow-xl hover:shadow-[#ff8a3d]/35 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#ff8a3d]/30"
              >
                Book This Service
                <ArrowRight
                  size={18}
                  className="transition group-hover:translate-x-1"
                />
              </button>

              <p className="mt-3 text-center text-xs text-[#8b8ba7]">
                Free cancellation · Pay after the service
              </p>
            </div>

          </div>
        </div>

        {/* ================= RELATED SERVICES ================= */}
        <section className="mt-14">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-xl font-extrabold text-[#11104f] sm:text-2xl">
                You may also like
              </h2>
              <p className="mt-1 text-sm text-[#6b6b8a]">
                More services from our trusted professionals
              </p>
            </div>

            <Link
              to="/services"
              className="hidden items-center gap-1.5 text-sm font-bold text-[#4338ca] transition hover:text-[#3730a3] sm:inline-flex"
            >
              View all
              <ArrowRight size={16} />
            </Link>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((item) => (
              <Link
                key={item.id}
                to={`/services/${item.id}`}
                className="group overflow-hidden rounded-3xl border border-[#e5e7eb] bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(17,16,79,0.12)]"
              >
                <div className="relative h-44 overflow-hidden bg-gradient-to-br from-[#4338ca] to-[#6366f1]">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                  <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#4338ca] backdrop-blur">
                    {item.category}
                  </span>
                </div>

                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-base font-extrabold text-[#11104f]">
                      {item.name}
                    </h3>
                    <span className="flex shrink-0 items-center gap-1 text-sm font-bold text-[#11104f]">
                      <Star size={14} fill="#ff8a3d" className="text-[#ff8a3d]" />
                      {item.rating}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-[#f0f0f7] pt-3">
                    <span className="text-lg font-extrabold text-[#4338ca]">
                      ₹{item.price}
                    </span>
                    <span className="flex items-center gap-1 text-xs font-semibold text-[#6b6b8a]">
                      <Clock size={13} />
                      {item.duration}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

      </div>
      {/* ================= PHOTO POP-UP (LIGHTBOX) ================= */}
      {lightboxImage && lightboxIndex !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${service.name} photos`}
          onClick={() => setLightbox(null)}
          className="fixed inset-0 z-[100] flex flex-col bg-[#0b0a33]/90 backdrop-blur-sm"
        >
          {/* Top bar: title, counter, close */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex items-center justify-between px-4 py-4 sm:px-8"
          >
            <div className="text-white">
              <p className="text-sm font-bold">{service.name}</p>
              <p className="text-xs text-white/60">
                {lightboxIndex + 1} / {total}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setLightbox(null)}
              aria-label="Close"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/25 focus:outline-none focus-visible:ring-4 focus-visible:ring-white/30"
            >
              <X size={22} />
            </button>
          </div>

          {/* Image with backward / forward buttons */}
          <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 sm:px-24">
            {total > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  showPrev();
                }}
                aria-label="Previous photo"
                className="absolute left-3 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur transition hover:bg-white/30 focus:outline-none focus-visible:ring-4 focus-visible:ring-white/30 sm:left-8"
              >
                <ChevronLeft size={26} />
              </button>
            )}

            <img
              src={lightboxImage}
              alt={`${service.name} photo ${lightboxIndex + 1}`}
              onClick={(e) => e.stopPropagation()}
              className="max-h-full max-w-full rounded-2xl object-contain shadow-2xl"
            />

            {total > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  showNext();
                }}
                aria-label="Next photo"
                className="absolute right-3 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur transition hover:bg-white/30 focus:outline-none focus-visible:ring-4 focus-visible:ring-white/30 sm:right-8"
              >
                <ChevronRight size={26} />
              </button>
            )}
          </div>

          {/* Thumbnail strip */}
          {total > 1 && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="overflow-x-auto px-4 py-5"
            >
              <div className="mx-auto flex w-max gap-3">
                {photos.map((src, index) => (
                  <button
                    key={src}
                    type="button"
                    onClick={() => setLightbox(index)}
                    aria-label={`Show photo ${index + 1}`}
                    className={`h-16 w-24 shrink-0 overflow-hidden rounded-xl border-2 transition focus:outline-none ${
                      index === lightboxIndex
                        ? "border-[#ff8a3d] opacity-100"
                        : "border-transparent opacity-60 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={src}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </main>
  );
};

export default ServiceDetails;