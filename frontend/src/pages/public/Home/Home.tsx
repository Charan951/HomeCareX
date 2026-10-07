import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import HeroSearch from "../../../components/public/HeroSearch";
import TrustStrip from "../../../components/public/TrustStrip";
import Testimonials from "../../../components/public/Testimonials";
import StatsStrip from "../../../components/public/StatsStrip";
import BannerSlider from "../../../components/public/BannerSlider";
import CategoryCard from "../../../components/public/CategoryCard";
/* =========================================================
   DESIGN TOKENS
   Brand: Indigo #4338ca (trust)  +  Orange #ff8a3d (energy)
   Indigo is used for structure and text, orange only for
   action and emphasis, so the accent always stands out.
========================================================= */

const styles = `
@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,800&family=DM+Sans:wght@400;500;700&display=swap');

.hcx {
  --indigo: #4338ca;
  --indigo-deep: #1e1b6e;
  --indigo-tint: #eef0ff;
  --orange: #ff8a3d;
  --orange-tint: #fff3ea;
  --ink: #1b1b3a;
  --muted: #5b5b7a;
  font-family: 'DM Sans', system-ui, sans-serif;
  color: var(--ink);
}
.hcx h1, .hcx h2, .hcx h3, .hcx .display {
  font-family: 'Bricolage Grotesque', 'DM Sans', system-ui, sans-serif;
  letter-spacing: -0.02em;
}

/* --- Hero: one orchestrated load sequence --- */
@keyframes hcx-fade { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
/* No "round" here, so the full-width hero has square edges */
@keyframes hcx-image { from { opacity: 0; clip-path: inset(0 0 100% 0); } to { opacity: 1; clip-path: inset(0 0 0 0); } }
@keyframes hcx-float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
@keyframes hcx-drift { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(30px,-24px) scale(1.08); } }
@keyframes hcx-draw { from { transform: scaleX(0); } to { transform: scaleX(1); } }

.hcx-in   { opacity: 0; animation: hcx-fade .8s cubic-bezier(.2,.7,.2,1) forwards; }
.hcx-img  { animation: hcx-image 1.2s cubic-bezier(.65,0,.2,1) .25s both; }
.hcx-float { animation: hcx-float 6s ease-in-out infinite; }
.hcx-drift { animation: hcx-drift 14s ease-in-out infinite; }

/* --- Scroll reveal (used sparingly) --- */
.hcx-reveal { opacity: 0; transform: translateY(24px); transition: opacity .8s cubic-bezier(.2,.7,.2,1), transform .8s cubic-bezier(.2,.7,.2,1); }
.hcx-reveal.is-in { opacity: 1; transform: none; }

/* --- Process line draws itself --- */
.hcx-line { transform: scaleX(0); transform-origin: left; }
.is-in .hcx-line, .hcx-line.is-in { animation: hcx-draw 1.4s cubic-bezier(.65,0,.2,1) .2s forwards; }

/* --- FAQ smooth open --- */
.hcx-acc { display: grid; grid-template-rows: 0fr; transition: grid-template-rows .4s ease; }
.hcx-acc.open { grid-template-rows: 1fr; }
.hcx-acc > div { overflow: hidden; }

.hcx-clamp2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }

/* --- Static multi-colour headline text (no animation) --- */
.hcx-grad { background: linear-gradient(90deg, #4338ca 0%, #ff8a3d 100%); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; color: transparent; }

/* --- Extra motion layer --- */
.hcx-progress { position: fixed; top: 0; left: 0; right: 0; height: 3px; z-index: 60; transform-origin: left; transform: scaleX(0); background: linear-gradient(90deg, #4338ca, #ff8a3d); }
@keyframes hcx-marquee { to { transform: translateX(-50%); } }
.hcx-marquee { animation: hcx-marquee 40s linear infinite; }
.hcx-marquee-wrap:hover .hcx-marquee { animation-play-state: paused; }
.hcx .hcx-tilt { position: relative; transform: perspective(900px) rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg)); transition: transform .15s ease-out, box-shadow .5s ease; }
.hcx .hcx-tilt:hover { transform: perspective(900px) translateY(-8px) rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg)); }
.hcx-tilt::after { content: ""; position: absolute; inset: 0; pointer-events: none; opacity: 0; transition: opacity .3s; background: radial-gradient(360px circle at var(--gx, 50%) var(--gy, 50%), rgba(255,255,255,.28), transparent 60%); }
.hcx-tilt:hover::after { opacity: 1; }
.hcx-reveal { filter: blur(8px); transform: translateY(32px) scale(.98); transition-property: opacity, transform, filter; }
.hcx-reveal.is-in { filter: blur(0); transform: none; }
@media (prefers-reduced-motion: reduce) {
  .hcx-reveal { filter: none !important; }
  .hcx .hcx-tilt { transform: none !important; }
}

@keyframes hcx-zoom { from { transform: scale(1.18); } to { transform: scale(1); } }
.hcx-zoom { animation: hcx-zoom 2.4s cubic-bezier(.2,.7,.2,1) 1s both; }

/* --- Hero search bar: give the fields room, wrap on small widths --- */
.hcx-search form { display: flex; flex-wrap: wrap; align-items: flex-end; gap: 14px; width: 100%; }
.hcx-search form > * { flex: 1 1 200px; min-width: 0; }
.hcx-search form > button { flex: 0 0 auto; }
.hcx-search input, .hcx-search select { min-width: 0; width: 100%; }
.hcx-search label { display: block; margin-bottom: 6px; font-size: .8rem; font-weight: 700; color: #1e1b6e; }

/* --- Focus + motion safety --- */
.hcx a:focus-visible, .hcx button:focus-visible { outline: 3px solid var(--orange); outline-offset: 3px; border-radius: 10px; }
@media (prefers-reduced-motion: reduce) {
  .hcx *, .hcx *::before, .hcx *::after { animation: none !important; transition: none !important; }
  .hcx-in, .hcx-img, .hcx-reveal { opacity: 1 !important; transform: none !important; clip-path: none !important; }
  .hcx-line { transform: none !important; }
}
`;

/* =========================================================
   DATA
========================================================= */

const services = [
  { id: "home-cleaning", title: "Home Cleaning", icon: "✨", description: "Professional cleaning to keep your home fresh, hygienic and comfortable.", image: "/images/home-cleaning.jpg" },
  { id: "plumbing", title: "Plumbing Services", icon: "🔧", description: "Reliable help with leaks, repairs, installations and maintenance.", image: "/images/plumbing.jpg" },
  { id: "electrical", title: "Electrical Services", icon: "⚡", description: "Safe, professional electrical work for every room in your home.", image: "/images/electrical.jpg" },
  { id: "painting", title: "Painting Services", icon: "🎨", description: "Clean, careful painting that gives your home a fresh new look.", image: "/images/painting.jpg" },
  { id: "appliance-repair", title: "Appliance Repair", icon: "🛠️", description: "Quick, dependable repairs for your household appliances.", image: "/images/appliance-repair.jpg" },
  { id: "home-maintenance", title: "Home Maintenance", icon: "🏠", description: "Regular upkeep that keeps your home safe and comfortable.", image: "/images/home-maintenance.jpg" },
];

/* ---------------------------------------------------------
   SERVICE CATALOG
   The "N services" count on each category card is calculated from
   this list, so it updates by itself whenever services are added or
   removed. The list below is sample data. To use your real data,
   change loadServiceCatalog() to fetch it from your backend.
--------------------------------------------------------- */
interface ServiceItem {
  id: string;
  categoryId: string;
  name: string;
}

const defaultCatalog: ServiceItem[] = ([
  ["home-cleaning", "Deep cleaning"], ["home-cleaning", "Kitchen cleaning"], ["home-cleaning", "Bathroom cleaning"],
  ["home-cleaning", "Sofa cleaning"], ["home-cleaning", "Carpet cleaning"], ["home-cleaning", "Window cleaning"],
  ["plumbing", "Leak repair"], ["plumbing", "Tap and mixer fitting"], ["plumbing", "Drain unblocking"],
  ["plumbing", "Water tank cleaning"], ["plumbing", "Pipe installation"],
  ["electrical", "Fan installation"], ["electrical", "Switch and socket repair"], ["electrical", "Light fitting"],
  ["electrical", "Wiring check"], ["electrical", "Inverter setup"],
  ["painting", "Interior painting"], ["painting", "Exterior painting"], ["painting", "Wall touch-ups"],
  ["appliance-repair", "AC repair"], ["appliance-repair", "Refrigerator repair"], ["appliance-repair", "Washing machine repair"],
  ["appliance-repair", "Microwave repair"], ["appliance-repair", "Water purifier service"], ["appliance-repair", "Geyser repair"],
  ["home-maintenance", "Furniture assembly"], ["home-maintenance", "Door and lock repair"], ["home-maintenance", "Carpentry work"],
] as [string, string][]).map(([categoryId, name], i) => ({ id: `svc-${i}`, categoryId, name }));

/** Replace the body with a real request, for example:
 *  const res = await fetch("/api/services"); return res.json();  */
async function loadServiceCatalog(): Promise<ServiceItem[]> {
  return defaultCatalog;
}

const popularIds = ["home-cleaning", "plumbing", "electrical", "appliance-repair"];

const steps = [
  { title: "Choose a service", text: "Pick the home service you need from our list." },
  { title: "Request it", text: "Share a few details and submit your request." },
  { title: "Get it done", text: "Connect with a professional and get the job completed." },
];

const faqs = [
  { question: "What services does HomeCareX provide?", answer: "HomeCareX provides home cleaning, plumbing, electrical services, painting, appliance repair and home maintenance." },
  { question: "How can I book a service?", answer: "Browse the services on HomeCareX, select the one you need, then continue with the service request process." },
  { question: "Can I choose a specific service?", answer: "Yes. You can select the exact home service you require." },
  { question: "How do I contact HomeCareX?", answer: "Use the Contact page on the website and we will assist you." },
  { question: "Is regular maintenance available?", answer: "Yes. Home maintenance services help keep your home safe and comfortable all year." },
];

/* Structured data so search engines can show the FAQ as rich results */
const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((f) => ({
    "@type": "Question",
    name: f.question,
    acceptedAnswer: { "@type": "Answer", text: f.answer },
  })),
};

/* =========================================================
   HOOKS + SMALL COMPONENTS
========================================================= */

/** Adds `is-in` once the element scrolls into view (runs once). */
function useInView<T extends HTMLElement>(threshold = 0.15) {
  const ref = useRef<T | null>(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSeen(true);
          io.disconnect();
        }
      },
      { threshold, rootMargin: "0px 0px -40px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);

  return [ref, seen] as const;
}

const Reveal: React.FC<{ children: React.ReactNode; delay?: number; className?: string }> = ({
  children,
  delay = 0,
  className = "",
}) => {
  const [ref, seen] = useInView<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className={`hcx-reveal ${seen ? "is-in" : ""} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

/** Thin bar at the top of the page that fills as you scroll. */
const ScrollProgress: React.FC = () => {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      if (ref.current) ref.current.style.transform = `scaleX(${h > 0 ? window.scrollY / h : 0})`;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return <div ref={ref} className="hcx-progress" aria-hidden />;
};

/** Spread onto any card: 3D tilt that follows the cursor, plus a light glare. */
const tilt = {
  onMouseMove: (e: React.MouseEvent<HTMLElement>) => {
    const el = e.currentTarget;
    el.classList.add("hcx-tilt");
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    el.style.setProperty("--ry", `${(x - 0.5) * 10}deg`);
    el.style.setProperty("--rx", `${(0.5 - y) * 8}deg`);
    el.style.setProperty("--gx", `${x * 100}%`);
    el.style.setProperty("--gy", `${y * 100}%`);
  },
  onMouseLeave: (e: React.MouseEvent<HTMLElement>) => {
    e.currentTarget.style.setProperty("--rx", "0deg");
    e.currentTarget.style.setProperty("--ry", "0deg");
  },
};

/** Endless scrolling strip of service names (pauses on hover). */
const Marquee: React.FC = () => (
  <div className="hcx-marquee-wrap overflow-hidden border-y border-[#4338ca]/10 bg-white py-5" aria-hidden>
    <div className="hcx-marquee flex w-max gap-12 pr-12">
      {[...services, ...services, ...services, ...services].map((s, i) => (
        <span key={i} className="display flex items-center gap-3 whitespace-nowrap text-xl font-bold text-[#1e1b6e]">
          <span className="text-2xl">{s.icon}</span>
          {s.title}
          <span className="ml-9 h-2 w-2 rounded-full bg-[#ff8a3d]" />
        </span>
      ))}
    </div>
  </div>
);

const SectionHead: React.FC<{ title: string; text?: string }> = ({ title, text }) => (
  <Reveal className="mx-auto mb-14 max-w-2xl text-center">
    <h2 className="text-3xl font-extrabold text-[#1e1b6e] sm:text-4xl lg:text-[2.75rem] lg:leading-[1.1]">
      {title}
    </h2>
    {text && <p className="mt-4 text-lg leading-8 text-[#5b5b7a]">{text}</p>}
  </Reveal>
);

/* =========================================================
   PAGE
========================================================= */

/**
 * Keeps hero content inside the available height at any browser zoom.
 * If the content is taller than the space, it is scaled down to fit;
 * if there is enough room it stays at normal size.
 */
const FitToHeight: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const outerRef = useRef<HTMLDivElement | null>(null);
  const innerRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);
  const PAD = 32; // breathing room (top + bottom)

  useEffect(() => {
    const fit = () => {
      const outer = outerRef.current;
      const inner = innerRef.current;
      if (!outer || !inner) return;
      const available = outer.clientHeight - PAD;
      const needed = inner.offsetHeight; // unaffected by transform
      setScale(needed > available && available > 0 ? available / needed : 1);
    };
    fit();
    const ro = new ResizeObserver(fit);
    if (outerRef.current) ro.observe(outerRef.current);
    if (innerRef.current) ro.observe(innerRef.current);
    window.addEventListener("resize", fit);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", fit);
    };
  }, []);

  return (
    <div ref={outerRef} className="flex h-full items-center">
      <div
        ref={innerRef}
        className="w-full max-w-3xl"
        style={{ transform: `scale(${scale})`, transformOrigin: "left center" }}
      >
        {children}
      </div>
    </div>
  );
};

const Home: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [catalog, setCatalog] = useState<ServiceItem[]>(defaultCatalog);
  const [processRef, processSeen] = useInView<HTMLDivElement>(0.3);
  const faqButtons = useRef<(HTMLButtonElement | null)[]>([]);

  // Load the service list, then keep the category counts in sync with it
  useEffect(() => {
    let active = true;
    loadServiceCatalog()
      .then((items) => {
        if (active) setCatalog(items);
      })
      .catch(() => {
        /* keep the default list if loading fails */
      });
    return () => {
      active = false;
    };
  }, []);

  const popularCategories = useMemo(
    () =>
      popularIds
        .map((id) => services.find((s) => s.id === id))
        .filter((s): s is (typeof services)[number] => Boolean(s))
        .map((s) => ({ ...s, count: catalog.filter((item) => item.categoryId === s.id).length })),
    [catalog]
  );

  /* FAQ keyboard support: arrow keys move between questions, Home / End jump to first / last */
  const handleFaqKeys = (e: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    const last = faqs.length - 1;
    let next = -1;
    if (e.key === "ArrowDown") next = index === last ? 0 : index + 1;
    else if (e.key === "ArrowUp") next = index === 0 ? last : index - 1;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = last;
    if (next >= 0) {
      e.preventDefault();
      faqButtons.current[next]?.focus();
    }
  };

  return (
    <div className="hcx overflow-x-hidden bg-white">
      <style>{styles}</style>
      <ScrollProgress />

      {/* ================= HERO (full-width image, text on top) ================= */}
      {/* The hero is exactly one screen tall (minus the real header height, which Header.tsx publishes as --hcx-nav). */}
      <section className="relative isolate overflow-hidden bg-[#eef0ff]">
        <div
          className="hcx-img relative h-[calc(100vh-var(--hcx-nav,130px))] overflow-hidden"
          style={{ height: "calc(100svh - var(--hcx-nav, 130px))" }}
        >
          {/* Photo: sharp, no blur */}
          <img
            src="/images/background.png"
            alt="HomeCareX professionals cleaning, repairing and maintaining a bright living room"
            className="hcx-zoom absolute inset-0 h-full w-full object-cover object-right"
          />

          {/* Soft light fade only behind the text so it stays readable; the right side of the photo is untouched */}
          <div className="absolute inset-y-0 left-0 w-full bg-white/75 md:w-[62%] md:bg-transparent md:bg-gradient-to-r md:from-white/90 md:via-white/65 md:to-transparent" />

          <div className="relative mx-auto h-full max-w-[1600px] px-6 sm:px-10 lg:px-16">
            <FitToHeight>
              <p
                className="hcx-in inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-base font-medium text-[#4338ca] shadow-sm ring-1 ring-[#4338ca]/10"
                style={{ animationDelay: "0.05s" }}
              >
                <span className="h-2 w-2 rounded-full bg-[#ff8a3d]" />
                Your home, our care
              </p>

              {/* Headline: static mixed colours (indigo to orange on "your home"), no animation */}
              <h1 className="mt-5 text-5xl font-extrabold leading-[1.05] text-[#1e1b6e] sm:text-6xl xl:text-7xl">
                Professional care
                <br />
                for <span className="hcx-grad">your home</span>
              </h1>

              <p
                className="hcx-in mt-5 max-w-2xl text-lg leading-8 text-[#5b5b7a] sm:text-xl"
                style={{ animationDelay: "0.65s" }}
              >
                Book trusted professionals for cleaning, plumbing, electrical work and maintenance, all in one place.
              </p>

              {/*
                Search / pincode bar
                - Desktop / web (768px and up): visible
                - Mobile (below 768px): completely hidden (display: none)
                  "hidden md:flex" matches the header, which also switches at md.
              */}
              <div
                className="hcx-in hcx-search mt-8 hidden items-center rounded-3xl bg-white p-5 shadow-[0_20px_50px_-20px_rgba(67,56,202,0.45)] ring-1 ring-[#4338ca]/10 sm:p-6 md:flex"
                style={{ animationDelay: "0.8s" }}
              >
                <div className="w-full">
                  <HeroSearch />
                </div>
              </div>

              {/* Mobile only: a simple button in place of the hidden search bar */}
              <div className="hcx-in mt-8 md:hidden" style={{ animationDelay: "0.8s" }}>
                <Link
                  to="/services"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#ff8a3d] px-7 py-3.5 font-bold text-[#1b1b3a] shadow-[0_10px_30px_-10px_rgba(255,138,61,0.9)] transition duration-300 hover:bg-[#ff7a22]"
                >
                  Explore services
                  <span aria-hidden>→</span>
                </Link>
              </div>
            </FitToHeight>
          </div>

          {/* Floating card, now inside the hero */}
          <div className="hcx-float absolute bottom-8 right-8 hidden rounded-2xl bg-white px-5 py-4 shadow-xl ring-1 ring-black/5 sm:block lg:right-16">
            <p className="text-xs font-medium text-[#5b5b7a]">Home services</p>
            <p className="display text-lg font-bold text-[#4338ca]">All in one place</p>
          </div>
        </div>
      </section>

      <Marquee />
      <BannerSlider />

      {/* ================= POPULAR CATEGORIES (animated cards) ================= */}
      <section
        id="categories"
        aria-labelledby="categories-heading"
        className="relative overflow-hidden bg-gradient-to-b from-white via-[#f5f6ff] to-white py-20 sm:py-28"
      >
        {/* Background: faded dot grid + two slowly drifting colour glows */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage: "radial-gradient(#4338ca 1px, transparent 1px)",
            backgroundSize: "24px 24px",
            WebkitMaskImage: "radial-gradient(ellipse at center, black 25%, transparent 75%)",
            maskImage: "radial-gradient(ellipse at center, black 25%, transparent 75%)",
          }}
          aria-hidden
        />
        <div
          className="hcx-drift pointer-events-none absolute -right-24 top-12 h-80 w-80 rounded-full bg-[#ff8a3d]/15 blur-3xl"
          aria-hidden
        />
        <div
          className="hcx-drift pointer-events-none absolute -left-24 bottom-0 h-96 w-96 rounded-full bg-[#4338ca]/10 blur-3xl"
          style={{ animationDelay: "-6s" }}
          aria-hidden
        />

        <div className="relative mx-auto max-w-7xl px-6">
          {/* Heading row: title on the left, "browse all" on the right */}
          <div className="mb-12 flex flex-col gap-6 md:mb-14 md:flex-row md:items-end md:justify-between">
            <Reveal className="max-w-2xl">
              <h2
                id="categories-heading"
                className="text-3xl font-extrabold text-[#1e1b6e] sm:text-4xl lg:text-[2.75rem] lg:leading-[1.1]"
              >
                Popular categories
              </h2>

              {/* Accent bar that draws itself when the heading appears */}
              <div className="mt-5 h-1 w-20 overflow-hidden rounded-full bg-[#4338ca]/10" aria-hidden>
                <div className="hcx-line h-full w-full bg-gradient-to-r from-[#4338ca] to-[#ff8a3d]" />
              </div>

              <p className="mt-5 text-lg leading-8 text-[#5b5b7a]">
                Explore our most requested home services and find the right professional for your needs.
              </p>
            </Reveal>

            <Reveal delay={150}>
              <Link
                to="/services"
                className="group inline-flex items-center gap-2 rounded-xl border-2 border-[#4338ca] bg-white px-6 py-3 font-bold text-[#4338ca] transition duration-300 hover:-translate-y-0.5 hover:bg-[#4338ca] hover:text-white"
              >
                Browse all services
                <span className="transition-transform duration-300 group-hover:translate-x-1" aria-hidden>→</span>
              </Link>
            </Reveal>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {popularCategories.map((c, i) => (
              <Reveal key={c.id} delay={i * 110}>
                <CategoryCard
                  id={c.id}
                  name={c.title}
                  description={c.description}
                  image={c.image}
                  serviceCount={c.count}
                  link={`/services/${c.id}`}
                  icon={c.icon}
                />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ================= SERVICES ================= */}
      <section id="services" className="scroll-mt-16 bg-[#eef0ff] py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-6">
          <SectionHead
            title="Everything your home needs"
            text="Professional home services delivered with convenience, reliability and care."
          />

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((s, i) => (
              <Reveal key={s.id} delay={(i % 3) * 90}>
                <Link
                  to={`/services/${s.id}`}
                  {...tilt}
                  className="group flex h-full flex-col overflow-hidden rounded-3xl bg-white ring-1 ring-[#4338ca]/10 transition duration-500 hover:-translate-y-2 hover:shadow-[0_30px_60px_-25px_rgba(67,56,202,0.45)] hover:ring-[#4338ca]/30"
                >
                  <div className="relative h-56 overflow-hidden">
                    <img
                      src={s.image}
                      alt={s.title}
                      loading="lazy"
                      className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1e1b6e]/60 via-transparent to-transparent" />
                    <span className="absolute bottom-4 left-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-xl shadow-lg transition duration-500 group-hover:-rotate-6 group-hover:bg-[#ff8a3d]">
                      {s.icon}
                    </span>
                  </div>

                  <div className="flex flex-1 flex-col p-7">
                    <h3 className="text-xl font-bold text-[#1e1b6e]">{s.title}</h3>
                    <p className="mt-3 flex-1 leading-7 text-[#5b5b7a]">{s.description}</p>
                    <span className="mt-6 inline-flex items-center gap-2 font-bold text-[#4338ca] group-hover:text-[#e06a12]">
                      Learn more
                      <span className="transition-transform duration-300 group-hover:translate-x-1.5" aria-hidden>→</span>
                    </span>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ================= WHY CHOOSE US (single section) ================= */}
      <TrustStrip />

      {/* ================= PROCESS ================= */}
      <section className="bg-[#eef0ff] py-20 sm:py-28">
        <div className="mx-auto max-w-6xl px-6">
          <SectionHead title="How HomeCareX works" text="Three steps from request to a job well done." />

          <div ref={processRef} className={`relative grid gap-12 md:grid-cols-3 ${processSeen ? "is-in" : ""}`}>
            {/* Connector line (desktop) that draws itself */}
            <div className="absolute left-[16.6%] right-[16.6%] top-8 hidden h-0.5 bg-[#4338ca]/10 md:block" aria-hidden>
              <div className="hcx-line h-full w-full bg-gradient-to-r from-[#4338ca] to-[#ff8a3d]" />
            </div>

            {steps.map((s, i) => (
              <Reveal key={s.title} delay={i * 180} className="relative text-center">
                <div
                  className={`display relative mx-auto flex h-16 w-16 items-center justify-center rounded-full text-2xl font-extrabold text-white shadow-lg ring-8 ring-[#eef0ff] ${
                    i === steps.length - 1 ? "bg-[#ff8a3d]" : "bg-[#4338ca]"
                  }`}
                >
                  {i + 1}
                </div>
                <h3 className="mt-6 text-xl font-bold text-[#1e1b6e]">{s.title}</h3>
                <p className="mx-auto mt-3 max-w-xs leading-7 text-[#5b5b7a]">{s.text}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ================= FAQ (two columns: intro + help card, accordion) ================= */}
      <section id="faq" aria-labelledby="faq-heading" className="relative overflow-hidden bg-white py-20 sm:py-28">
        {/* Search engines can show these questions as rich results */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

        {/* Soft background glow */}
        <div
          className="pointer-events-none absolute -left-32 top-10 h-96 w-96 rounded-full bg-[#eef0ff] blur-3xl"
          aria-hidden
        />

        <div className="relative mx-auto max-w-7xl px-6">
          <div className="grid gap-12 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
            {/* ---------- Left: heading + help card (stays in view on desktop) ---------- */}
            <div className="lg:sticky lg:top-28 lg:self-start">
              <Reveal>
                <h2
                  id="faq-heading"
                  className="text-3xl font-extrabold text-[#1e1b6e] sm:text-4xl lg:text-[2.75rem] lg:leading-[1.1]"
                >
                  Frequently asked questions
                </h2>
                <p className="mt-4 max-w-md text-lg leading-8 text-[#5b5b7a]">
                  Everything you need to know about HomeCareX, answered in one place.
                </p>
              </Reveal>

              <Reveal delay={120}>
                <div className="relative mt-10 overflow-hidden rounded-3xl bg-[#1e1b6e] p-7 text-white shadow-[0_30px_60px_-30px_rgba(30,27,110,0.8)] sm:p-8">
                  <div
                    className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#ff8a3d]/30 blur-2xl"
                    aria-hidden
                  />
                  <span
                    className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20"
                    aria-hidden
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15a2 2 0 01-2 2H8l-5 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                    </svg>
                  </span>
                  <h3 className="display relative mt-5 text-2xl font-bold">Still have questions?</h3>
                  <p className="relative mt-2 leading-7 text-white/80">
                    Can&apos;t find what you are looking for? Send us a message and we will help you out.
                  </p>
                  <Link
                    to="/contact"
                    className="group relative mt-6 inline-flex items-center gap-2 rounded-xl bg-[#ff8a3d] px-6 py-3 font-bold text-[#1b1b3a] shadow-[0_10px_30px_-10px_rgba(255,138,61,0.9)] transition duration-300 hover:-translate-y-0.5 hover:bg-[#ff7a22]"
                  >
                    Contact us
                    <span className="transition-transform duration-300 group-hover:translate-x-1" aria-hidden>→</span>
                  </Link>
                </div>
              </Reveal>
            </div>

            {/* ---------- Right: accordion ---------- */}
            <div className="space-y-3">
              {faqs.map((f, i) => {
                const open = openFaq === i;
                return (
                  <Reveal key={f.question} delay={i * 70}>
                    <div
                      className={`relative overflow-hidden rounded-2xl transition duration-300 ${
                        open
                          ? "bg-[#eef0ff] shadow-lg shadow-[#4338ca]/10 ring-1 ring-[#4338ca]/25"
                          : "bg-white ring-1 ring-[#4338ca]/10 hover:shadow-md hover:ring-[#4338ca]/30"
                      }`}
                    >
                      {/* Accent bar that grows in when the question is open */}
                      <span
                        className={`absolute inset-y-0 left-0 w-1 origin-top bg-[#ff8a3d] transition-transform duration-300 ${
                          open ? "scale-y-100" : "scale-y-0"
                        }`}
                        aria-hidden
                      />

                      <h3>
                        <button
                          type="button"
                          ref={(el) => {
                            faqButtons.current[i] = el;
                          }}
                          onClick={() => setOpenFaq(open ? null : i)}
                          onKeyDown={(e) => handleFaqKeys(e, i)}
                          aria-expanded={open}
                          aria-controls={`faq-panel-${i}`}
                          id={`faq-btn-${i}`}
                          className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left sm:px-7 sm:py-6"
                        >
                          <span
                            className={`text-lg font-bold transition-colors duration-300 ${
                              open ? "text-[#4338ca]" : "text-[#1e1b6e]"
                            }`}
                          >
                            {f.question}
                          </span>
                          <span
                            className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full transition duration-300 ${
                              open
                                ? "rotate-45 bg-[#ff8a3d] text-white shadow-md"
                                : "bg-[#eef0ff] text-[#4338ca]"
                            }`}
                            aria-hidden
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.75" strokeLinecap="round">
                              <path d="M12 5v14M5 12h14" />
                            </svg>
                          </span>
                        </button>
                      </h3>

                      <div
                        id={`faq-panel-${i}`}
                        role="region"
                        aria-labelledby={`faq-btn-${i}`}
                        className={`hcx-acc ${open ? "open" : ""}`}
                      >
                        <div>
                          <p className="px-6 pb-6 pr-16 leading-7 text-[#5b5b7a] sm:px-7 sm:pb-7">{f.answer}</p>
                        </div>
                      </div>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <Testimonials />
      <StatsStrip />

      {/* ================= FINAL CALL TO ACTION (customer + professional) ================= */}
      <section className="bg-white px-6 py-20 sm:py-28">
        <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-2">
          <Reveal>
            <div className="flex h-full flex-col rounded-3xl bg-[#eef0ff] p-8 ring-1 ring-[#4338ca]/10 sm:p-10">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#4338ca] text-2xl shadow-md" aria-hidden>🏠</span>
              <h2 className="mt-6 text-3xl font-extrabold leading-tight text-[#1e1b6e] sm:text-4xl">
                Need help with your home?
              </h2>
              <p className="mt-4 flex-1 text-lg leading-8 text-[#5b5b7a]">
                Find reliable home services and make home maintenance simple and convenient.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  to="/services"
                  className="rounded-xl bg-[#ff8a3d] px-7 py-3.5 font-bold text-[#1b1b3a] shadow-[0_10px_30px_-10px_rgba(255,138,61,0.9)] transition duration-300 hover:-translate-y-0.5 hover:bg-[#ff7a22]"
                >
                  Explore services
                </Link>
                <Link
                  to="/contact"
                  className="rounded-xl border-2 border-[#4338ca] px-7 py-3.5 font-bold text-[#4338ca] transition duration-300 hover:-translate-y-0.5 hover:bg-[#4338ca] hover:text-white"
                >
                  Contact us
                </Link>
              </div>
            </div>
          </Reveal>

          <Reveal delay={120}>
            <div className="flex h-full flex-col rounded-3xl bg-[#fff3ea] p-8 ring-1 ring-[#ff8a3d]/30 sm:p-10">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#ff8a3d] text-2xl shadow-md" aria-hidden>🧰</span>
              <h2 className="mt-6 text-3xl font-extrabold leading-tight text-[#1e1b6e] sm:text-4xl">
                Are you a service professional?
              </h2>
              <p className="mt-4 flex-1 text-lg leading-8 text-[#5b5b7a]">
                Join HomeCareX and connect with customers who are looking for your skills.
              </p>
              <div className="mt-8">
                <Link
                  to="/contact#partner-interest"
                  className="group inline-flex items-center gap-2 rounded-xl bg-[#4338ca] px-7 py-3.5 font-bold text-white transition duration-300 hover:-translate-y-0.5 hover:bg-[#1e1b6e]"
                >
                  Join as a professional
                  <span className="transition-transform duration-300 group-hover:translate-x-1" aria-hidden>→</span>
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
};

export default Home;