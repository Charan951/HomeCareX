import React, { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  CalendarCheck,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Headphones,
  Share2,
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

/* NEW: extra details shown in the new sections */
interface ServiceDetail {
  reviews: number;
  earliest: string;
  included: string[];
  notCovered: string[];
  faqs: { q: string; a: string }[];
}

type TabId = "overview" | "included" | "faqs" | "reviews";

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

/*
  NEW: per-service details for "What's included", "Not covered",
  FAQs, review count and earliest slot.
  Replace with real data (API / database) when you have it.
*/
const defaultDetail: ServiceDetail = {
  reviews: 100,
  earliest: "Today",
  included: [
    "Trained professional",
    "Required tools and equipment",
    "Post-service check",
  ],
  notCovered: ["Materials and spare parts", "Work outside the booked scope"],
  faqs: [
    {
      q: "Can I reschedule or cancel my booking?",
      a: "Yes. You can reschedule or cancel for free before the professional is on the way.",
    },
    {
      q: "When do I pay?",
      a: "You pay after the service is completed, once you are satisfied with the work.",
    },
  ],
};

const serviceDetails: Record<string, ServiceDetail> = {
  SERVICE001: {
    reviews: 312,
    earliest: "Today",
    included: [
      "Dusting and wiping of all surfaces",
      "Floor sweeping and mopping",
      "Bathroom and kitchen surface cleaning",
    ],
    notCovered: ["Deep stain removal", "Exterior windows and balcony grills"],
    faqs: [
      {
        q: "Do I need to provide cleaning supplies?",
        a: "No. Our professional brings the basic equipment and supplies needed for the job.",
      },
      {
        q: "Do I need to be at home?",
        a: "Someone should be present at the start and end of the service so the work can be checked.",
      },
    ],
  },
  SERVICE002: {
    reviews: 188,
    earliest: "Today",
    included: [
      "Leak and blockage inspection",
      "Tap, pipe and fitting repair",
      "Basic tools and labour",
    ],
    notCovered: ["Replacement parts and fittings", "Major pipe re-laying work"],
    faqs: [
      {
        q: "Are spare parts included in the price?",
        a: "Parts are charged separately. The professional will share the cost before replacing anything.",
      },
      {
        q: "What if the issue is bigger than expected?",
        a: "You will get a quote for the extra work and can decide whether to go ahead.",
      },
    ],
  },
  SERVICE003: {
    reviews: 164,
    earliest: "Today",
    included: [
      "Fault diagnosis",
      "Switch, socket and fan repair",
      "Safety check after the work",
    ],
    notCovered: ["New wiring or rewiring", "Cost of replacement parts"],
    faqs: [
      {
        q: "Is the work safe?",
        a: "Yes. Every job is done by a verified electrician who follows standard safety practice.",
      },
      {
        q: "Can you install new fixtures?",
        a: "Yes, basic fixture installation is covered. The fixtures themselves are not included.",
      },
    ],
  },
  SERVICE004: {
    reviews: 142,
    earliest: "Tomorrow",
    included: [
      "Inspection and diagnosis",
      "Repair of common faults",
      "Basic tools and labour",
    ],
    notCovered: ["Replacement parts", "Appliances under brand warranty"],
    faqs: [
      {
        q: "Which appliances do you repair?",
        a: "Common household appliances such as washing machines, refrigerators and microwaves.",
      },
      {
        q: "Is there a warranty on the repair?",
        a: "Repairs come with a short service warranty. Ask your professional for the exact terms.",
      },
    ],
  },
  SERVICE005: {
    reviews: 96,
    earliest: "Tomorrow",
    included: [
      "Surface preparation",
      "Painting labour",
      "Basic clean-up after the work",
    ],
    notCovered: ["Paint and materials", "Major wall repair or waterproofing"],
    faqs: [
      {
        q: "Who provides the paint?",
        a: "Paint is charged separately. You can choose the brand and shade, or ask us to arrange it.",
      },
      {
        q: "How long does a room take?",
        a: "Most rooms take one to two days, depending on size and surface condition.",
      },
    ],
  },
  SERVICE006: {
    reviews: 121,
    earliest: "Today",
    included: [
      "General home inspection",
      "Minor fixes and adjustments",
      "Basic tools and labour",
    ],
    notCovered: ["Spare parts and materials", "Structural repairs"],
    faqs: [
      {
        q: "What counts as minor repairs?",
        a: "Things like loose fittings, door and hinge adjustments, and small fixes around the home.",
      },
      {
        q: "Can I book several small jobs together?",
        a: "Yes. List everything when you book so the professional plans enough time.",
      },
    ],
  },
  SERVICE007: {
    reviews: 276,
    earliest: "Today",
    included: [
      "Full-home deep scrubbing",
      "Bathroom and kitchen descaling",
      "Floor and surface polishing",
    ],
    notCovered: ["Exterior glass and facade", "Furniture shifting and moving"],
    faqs: [
      {
        q: "How is deep cleaning different from regular cleaning?",
        a: "It covers hard-to-reach spots, build-up and stains that a regular clean skips.",
      },
      {
        q: "How many people will come?",
        a: "A small team may be sent for larger homes so the work finishes within the time shown.",
      },
    ],
  },
  SERVICE008: {
    reviews: 203,
    earliest: "Today",
    included: [
      "Tile and floor scrubbing",
      "Basin, toilet and fixture cleaning",
      "Mirror and fitting wipe-down",
    ],
    notCovered: [
      "Plumbing repairs",
      "Removal of long-term hard-water damage",
    ],
    faqs: [
      {
        q: "Are cleaning chemicals provided?",
        a: "Yes. The professional brings suitable cleaning products for the job.",
      },
      {
        q: "Can you clean more than one bathroom?",
        a: "Yes. Mention the number of bathrooms when booking so enough time is reserved.",
      },
    ],
  },
  SERVICE009: {
    reviews: 189,
    earliest: "Today",
    included: [
      "Counter, sink and stove cleaning",
      "Cabinet exterior wipe-down",
      "Floor and tile cleaning",
    ],
    notCovered: [
      "Inside of chimney and exhaust ducts",
      "Appliance interior deep cleaning",
    ],
    faqs: [
      {
        q: "Is the kitchen safe to use afterwards?",
        a: "Yes. Food-safe products are used, and surfaces are wiped dry at the end.",
      },
      {
        q: "Do I need to empty the cabinets?",
        a: "Not for exterior cleaning. Interior cabinet cleaning is not part of this service.",
      },
    ],
  },
};

/* NEW: more FAQs. Shown after each service's own FAQs. */
type Faq = { q: string; a: string };

/* Extra FAQs for specific services */
const extraFaqs: Record<string, Faq[]> = {
  SERVICE001: [
    { q: "Can I book a cleaning for a specific room only?", a: "Yes. Tell us which rooms you want cleaned when you book and the professional will focus on those." },
    { q: "Is the service suitable for homes with pets?", a: "Yes. Let us know about your pets so the professional can use pet-safe products and take extra care." },
  ],
  SERVICE002: [
    { q: "Do you handle emergency leaks?", a: "Pick the earliest slot shown on the page. For urgent leaks, switch off the main water supply until the plumber arrives." },
    { q: "Do you fix water-pressure problems?", a: "Yes. The plumber will check taps, pipes and the tank outlet to find the cause of low pressure." },
  ],
  SERVICE003: [
    { q: "Can you fix a tripping circuit breaker?", a: "Yes. The electrician will check the load and wiring to find why the breaker keeps tripping." },
    { q: "Should I switch off the power before you arrive?", a: "Please keep the area safe and accessible. The electrician will switch off the supply before starting work." },
  ],
  SERVICE004: [
    { q: "What if my appliance cannot be repaired?", a: "The professional will tell you honestly, explain the options and charge only for the inspection." },
    { q: "Do I need to keep the bill or warranty card ready?", a: "It helps if the appliance is under warranty. Keep the bill or warranty card handy for the visit." },
  ],
  SERVICE005: [
    { q: "Do I need to move my furniture before painting?", a: "Please clear what you can. The team will cover and protect the remaining furniture and floors." },
    { q: "How long before I can use the room again?", a: "Most rooms are usable after 24 hours. Full drying and paint smell depend on the paint type and ventilation." },
  ],
  SERVICE006: [
    { q: "Can I get a regular maintenance visit?", a: "Yes. You can book this service again whenever you need, and mention your preferred day when booking." },
    { q: "Do you handle both indoor and outdoor fixes?", a: "Mostly indoor fixes. Mention any outdoor work when booking and the team will confirm whether it can be done." },
  ],
  SERVICE007: [
    { q: "Do I need to empty the house before deep cleaning?", a: "No. Just put away valuables and fragile items. The team will clean around your furniture." },
    { q: "How often should I book a deep clean?", a: "Most homes benefit from a deep clean every 3 to 6 months, depending on use and the number of people at home." },
  ],
  SERVICE008: [
    { q: "Will you remove old soap scum and stains?", a: "Yes, regular build-up is removed. Very old or permanent stains may not come off completely." },
    { q: "Is the bathroom usable right after cleaning?", a: "Yes. Surfaces are rinsed and wiped, and you can use the bathroom once the floor is dry." },
  ],
  SERVICE009: [
    { q: "Do you clean greasy walls and tiles?", a: "Yes. Grease on tiles and walls around the stove and counters is part of the cleaning." },
    { q: "Can you clean the inside of the refrigerator?", a: "Interior appliance cleaning is not part of this service. Exterior surfaces of appliances are wiped down." },
  ],
};

/* FAQs shown for every service */
const commonFaqs: Faq[] = [
  { q: "How do I book this service?", a: "Tap Book now, pick your date and time, add any extras, and confirm. You will get a confirmation straight away." },
  { q: "How do I know the professional is verified?", a: "Every professional is background-checked and trained before joining. You can see their details before they arrive." },
  { q: "What payment methods are accepted?", a: "You pay after the service is completed. Cash and common digital payment options are accepted." },
  { q: "What if I am not happy with the work?", a: "Contact our support team within 24 hours of the service and we will arrange a fix or look into the issue." },
  { q: "Can I change the time or address after booking?", a: "Yes. You can change the slot or address before the professional is on the way, at no extra charge." },
  { q: "Will the professional arrive on time?", a: "Yes. You will get updates when the professional is on the way. If there is a delay, we will let you know." },
];

/* NEW: sample reviews. Replace with real reviews from your API. */
const sampleReviews = [
  {
    name: "Ananya R.",
    rating: 5,
    date: "2 weeks ago",
    text: "On time, polite and did a very neat job. Would book again.",
  },
  {
    name: "Suresh K.",
    rating: 5,
    date: "1 month ago",
    text: "Good value for the price and the booking process was simple.",
  },
  {
    name: "Divya M.",
    rating: 4,
    date: "1 month ago",
    text: "Work quality was great. The professional arrived a little late.",
  },
];

/* NEW: tab list */
const tabs: { id: TabId; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "included", label: "Included" },
  { id: "faqs", label: "FAQs" },
  { id: "reviews", label: "Reviews" },
];

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

  /* NEW: details for the extra sections */
  const detail = (service && serviceDetails[service.id]) || defaultDetail;

  /* NEW: all FAQs = service FAQs + extra FAQs + common FAQs */
  const allFaqs: Faq[] = [
    ...detail.faqs,
    ...((service && extraFaqs[service.id]) || []),
    ...commonFaqs,
  ];

  /* ---------- Photos under the price ---------- */

  const [failed, setFailed] = useState<string[]>([]);
  const [lightbox, setLightbox] = useState<number | null>(null);
  const [selected, setSelected] = useState(0); // NEW: main photo

  /* NEW: state for tabs, FAQ accordion and share button */
  const [activeTab, setActiveTab] = useState<TabId>("overview"); // NEW: Overview is shown first
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [copied, setCopied] = useState(false);

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
    setSelected(0);
    setActiveTab("overview");
    setOpenFaq(0);
  }, [id]);

  /* ---------- Pop-up viewer (lightbox) ---------- */

  const total = photos.length;
  const selectedIndex = Math.min(selected, Math.max(total - 1, 0));

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

  /* ---------- NEW: open a tab (used by the "reviews" link) ---------- */

  const goToSection = (tabId: TabId) => {
    setActiveTab(tabId);
    document
      .getElementById("service-tabs")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  /* ---------- NEW: share ---------- */

  const handleShare = async () => {
    if (!service) return;
    const url = window.location.href;

    try {
      if (navigator.share) {
        await navigator.share({ title: service.name, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* user cancelled or clipboard blocked */
    }
  };

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

  /* ---------- NEW: content for each tab ---------- */

  const aboutContent = (
    <section>
      <h2 className="text-xl font-extrabold text-[#11104f] sm:text-2xl">
        About this service
      </h2>
      <p className="mt-3 max-w-2xl text-base leading-7 text-[#55556f]">
        {service.description}
      </p>

      {/* Existing trust points, now inside Overview */}
      <ul className="mt-6 grid gap-4 sm:grid-cols-2">
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

      <p className="mt-5 text-sm text-[#8b8ba7]">
        Free cancellation · Pay after the service
      </p>
    </section>
  );

  const includedContent = (
    <section>
      <h2 className="text-xl font-extrabold text-[#11104f] sm:text-2xl">
        What's included
      </h2>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl border border-[#a7e3bd] bg-[#eefaf2] p-6">
          <h3 className="text-base font-extrabold text-[#166534]">You get</h3>
          <ul className="mt-4 space-y-3">
            {detail.included.map((item) => (
              <li
                key={item}
                className="flex items-center gap-3 text-sm text-[#11104f]"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#d1f0dc] text-[#16a34a]">
                  <Check size={14} strokeWidth={3} />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-3xl border border-[#e5e7eb] bg-white p-6">
          <h3 className="text-base font-extrabold text-[#11104f]">
            Not covered
          </h3>
          <ul className="mt-4 space-y-3">
            {detail.notCovered.map((item) => (
              <li
                key={item}
                className="flex items-center gap-3 text-sm text-[#6b6b8a]"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#eeeef5] text-[#8b8ba7]">
                  <X size={14} strokeWidth={3} />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );

  const faqsContent = (
    <section>
      <h2 className="text-xl font-extrabold text-[#11104f] sm:text-2xl">
        Questions people ask
      </h2>

      <div className="mt-4 space-y-3">
        {allFaqs.map((faq, index) => {
          const open = openFaq === index;
          return (
            <div
              key={faq.q}
              className="rounded-2xl border border-[#e5e7eb] bg-white"
            >
              <button
                type="button"
                aria-expanded={open}
                onClick={() => setOpenFaq(open ? null : index)}
                className="flex w-full items-center justify-between gap-4 rounded-2xl px-5 py-4 text-left text-sm font-bold text-[#11104f] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#6366f1]/20"
              >
                {faq.q}
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#eef2ff] text-[#4338ca]">
                  <ChevronDown
                    size={18}
                    className={`transition ${open ? "rotate-180" : ""}`}
                  />
                </span>
              </button>
              {open && (
                <p className="px-5 pb-5 text-sm leading-6 text-[#55556f]">
                  {faq.a}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );

  const reviewsContent = (
    <section>
      <h2 className="text-xl font-extrabold text-[#11104f] sm:text-2xl">
        Reviews
      </h2>

      <div className="mt-4 flex items-center gap-4 rounded-3xl border border-[#e5e7eb] bg-white p-6">
        <p className="text-4xl font-extrabold text-[#11104f]">
          {service.rating}
        </p>
        <div>
          <div className="flex items-center gap-0.5">
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
          </div>
          <p className="mt-1 text-sm text-[#6b6b8a]">
            Based on {detail.reviews} reviews
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {sampleReviews.map((review) => (
          <article
            key={review.name}
            className="rounded-2xl border border-[#e5e7eb] bg-white p-5"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#eef2ff] text-sm font-extrabold text-[#4338ca]">
                  {review.name.charAt(0)}
                </span>
                <div>
                  <p className="text-sm font-bold text-[#11104f]">
                    {review.name}
                  </p>
                  <p className="text-xs text-[#8b8ba7]">{review.date}</p>
                </div>
              </div>

              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star
                    key={n}
                    size={14}
                    fill={n <= review.rating ? "#ff8a3d" : "none"}
                    className={
                      n <= review.rating ? "text-[#ff8a3d]" : "text-[#d1d5db]"
                    }
                  />
                ))}
              </div>
            </div>

            <p className="mt-3 text-sm leading-6 text-[#55556f]">
              {review.text}
            </p>
          </article>
        ))}
      </div>
    </section>
  );

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

        {/* ================= PHOTOS (top, full width) ================= */}
        <div>
          {/* Main photo (click to open the pop-up viewer) */}
          <button
            type="button"
            onClick={() => total > 0 && setLightbox(selectedIndex)}
            aria-label="Open photo viewer"
            className="group relative block h-56 w-full cursor-zoom-in overflow-hidden rounded-3xl border border-[#e5e7eb] bg-gradient-to-br from-[#4338ca] to-[#6366f1] shadow-[0_20px_60px_rgba(17,16,79,0.08)] sm:h-72 lg:h-[24rem]"
          >
            {total > 0 && (
              <img
                src={photos[selectedIndex]}
                alt={service.name}
                onError={() => markFailed(photos[selectedIndex])}
                className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
              />
            )}

            <div className="absolute inset-0 bg-gradient-to-t from-[#11104f]/40 via-transparent to-transparent" />

            <span className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-bold text-[#11104f] opacity-0 backdrop-blur transition group-hover:opacity-100">
              <ZoomIn size={14} />
              View photos {total > 0 && `(${total})`}
            </span>
          </button>

          {/* Thumbnails (click to change the main photo) */}
          {total > 1 && (
            <div className="mt-3 flex gap-2.5 overflow-x-auto pb-1">
              {photos.map((src, index) => (
                <button
                  key={src}
                  type="button"
                  onClick={() => setSelected(index)}
                  aria-label={`Show photo ${index + 1} of ${total}`}
                  className={`h-16 w-24 shrink-0 overflow-hidden rounded-xl border-2 bg-[#eef2ff] transition focus:outline-none focus-visible:ring-4 focus-visible:ring-[#6366f1]/20 ${
                    index === selectedIndex
                      ? "border-[#4338ca]"
                      : "border-transparent opacity-80 hover:opacity-100"
                  }`}
                >
                  <img
                    src={src}
                    alt={`${service.name} photo ${index + 1}`}
                    onError={() => markFailed(src)}
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ================= TWO COLUMNS: tabs (left) + booking card (right) ================= */}
        <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">

          {/* ---------- RIGHT: BOOKING CARD ---------- */}
          <aside className="lg:order-2 lg:sticky lg:top-6">
            <div className="rounded-[2rem] border border-[#e5e7eb] bg-white p-5 shadow-[0_20px_60px_rgba(17,16,79,0.10)]">

              {/* Category chip + share */}
              <div className="flex items-start justify-between gap-3">
                <span className="rounded-full bg-[#eef2ff] px-3 py-1.5 text-xs font-bold text-[#4338ca]">
                  {service.category}
                </span>

                <button
                  type="button"
                  onClick={handleShare}
                  aria-label="Share this service"
                  title={copied ? "Link copied" : "Share"}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-[#e5e7eb] text-[#11104f] transition hover:bg-[#f8f9ff] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#6366f1]/20"
                >
                  {copied ? <Check size={18} /> : <Share2 size={18} />}
                </button>
              </div>

              {/* Name */}
              <h1 className="mt-3 text-2xl font-extrabold leading-tight tracking-tight text-[#11104f]">
                {service.name}
              </h1>

              {/* Rating + reviews */}
              <div className="mt-2 flex flex-wrap items-center gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star
                    key={n}
                    size={16}
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
                <button
                  type="button"
                  onClick={() => goToSection("reviews")}
                  className="ml-2 text-sm text-[#6b6b8a] underline decoration-[#d1d5db] underline-offset-4 transition hover:text-[#4338ca]"
                >
                  {detail.reviews} reviews
                </button>
              </div>

              {/* Starting at + duration ticket */}
              <div className="mt-4 grid grid-cols-[1fr_auto] overflow-hidden rounded-2xl bg-[#ede9fe]">
                <div className="p-4">
                  <p className="text-xs text-[#6b6b8a]">Starting at</p>
                  <p className="text-3xl font-extrabold text-[#11104f]">
                    ₹{service.price}
                  </p>
                </div>
                <div className="flex min-w-[84px] flex-col items-center justify-center border-l-2 border-dashed border-[#c4b5fd] px-4">
                  <Clock size={16} className="text-[#4338ca]" />
                  <p className="mt-1 text-sm font-extrabold text-[#11104f]">
                    {service.duration}
                  </p>
                </div>
              </div>

              {/* Slots */}
              <div className="mt-3 flex items-center gap-3 rounded-2xl border border-[#a7e3bd] bg-[#eefaf2] px-4 py-3">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#16a34a]" />
                <div>
                  <p className="text-sm font-bold text-[#166534]">
                    Slots open this week
                  </p>
                  <p className="text-xs text-[#166534]/80">
                    Earliest: {detail.earliest}
                  </p>
                </div>
              </div>

              {/* Book now */}
              <button
                type="button"
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-[#4338ca] px-6 py-4 text-base font-bold text-white shadow-lg shadow-[#4338ca]/30 transition hover:-translate-y-0.5 hover:bg-[#3730a3] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#4338ca]/30"
              >
                <CalendarCheck size={18} />
                Book now
              </button>

              <p className="mt-3 text-center text-xs text-[#8b8ba7]">
                Pick your date, time and add-ons in the next steps.
              </p>
            </div>
          </aside>

          {/* ---------- LEFT: TABS + CONTENT ---------- */}
          <div id="service-tabs" className="min-w-0 scroll-mt-4 lg:order-1">
            <div
              role="tablist"
              aria-label="Service sections"
              className="sticky top-2 z-20 flex gap-1 overflow-x-auto rounded-full border border-[#e5e7eb] bg-white p-1.5 shadow-[0_8px_24px_rgba(17,16,79,0.06)]"
            >
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  id={`tab-${tab.id}`}
                  aria-selected={activeTab === tab.id}
                  aria-controls="service-tabpanel"
                  onClick={() => setActiveTab(tab.id)}
                  className={`shrink-0 rounded-full px-5 py-2.5 text-sm font-bold transition focus:outline-none focus-visible:ring-4 focus-visible:ring-[#6366f1]/20 ${
                    activeTab === tab.id
                      ? "bg-[#4338ca] text-white shadow-md shadow-[#4338ca]/25"
                      : "text-[#6b6b8a] hover:text-[#11104f]"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div
              role="tabpanel"
              id="service-tabpanel"
              aria-labelledby={`tab-${activeTab}`}
              className="pt-8"
            >
              {activeTab === "overview" && aboutContent}
              {activeTab === "included" && includedContent}
              {activeTab === "faqs" && faqsContent}
              {activeTab === "reviews" && reviewsContent}
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