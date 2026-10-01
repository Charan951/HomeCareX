import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import HeroSearch from "../../../components/public/HeroSearch";
import TrustStrip from "../../../components/public/TrustStrip";
import Testimonials from "../../../components/public/Testimonials";
import StatsStrip from "../../../components/public/StatsStrip";

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

/* --- Blog coverflow carousel --- */
.hcx-cf { perspective: 1400px; }
.hcx-cf-card {
  position: absolute; top: 16px; bottom: 16px; left: 50%;
  width: min(300px, 70vw); overflow: hidden; border-radius: 28px; background: #1e1b6e;
  transition: transform .8s cubic-bezier(.2,.7,.2,1), opacity .8s ease, filter .8s ease, box-shadow .8s ease;
  will-change: transform;
}
@keyframes hcx-fill { from { transform: scaleX(0); } to { transform: scaleX(1); } }
.hcx-fill { animation-name: hcx-fill; animation-timing-function: linear; animation-fill-mode: forwards; }
.hcx-clamp2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
@media (max-width: 639px) { .hcx-cf-card[data-far="true"] { opacity: 0 !important; pointer-events: none; } }

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

interface BlogPost {
  id: string;
  title: string;
  category: string;
  excerpt: string;
  readTime: string;
  image: string;
}

const blogs: BlogPost[] = [
  { id: "habits-for-a-cleaner-home", title: "7 Simple Habits for a Cleaner Home", category: "Cleaning", excerpt: "Small daily routines that keep every room fresh without a weekend of scrubbing.", readTime: "5 min", image: "/images/blog-cleaning.jpg" },
  { id: "signs-you-need-a-plumber", title: "Signs You Need a Plumber Before It Gets Costly", category: "Plumbing", excerpt: "Slow drains, damp walls and odd noises: what to watch for and when to call.", readTime: "4 min", image: "/images/blog-plumbing.jpg" },
  { id: "electrical-safety-checklist", title: "An Electrical Safety Checklist for Every Home", category: "Electrical", excerpt: "Quick checks for sockets, wiring and appliances that keep your family safe.", readTime: "6 min", image: "/images/electrical.jpg" },
  { id: "choosing-paint-colours", title: "Choosing Paint Colours That Brighten Any Room", category: "Painting", excerpt: "How light, space and mood help you pick a colour you will love for years.", readTime: "5 min", image: "/images/painting.jpg" },
  { id: "repair-or-replace-appliances", title: "Repair or Replace? A Guide for Your Appliances", category: "Appliances", excerpt: "A simple way to decide when a repair makes sense and when it does not.", readTime: "4 min", image: "/images/appliance-repair.jpg" },
  { id: "seasonal-maintenance-checklist", title: "A Seasonal Home Maintenance Checklist", category: "Maintenance", excerpt: "What to inspect each season so small issues never become big repairs.", readTime: "7 min", image: "/images/blog-maintenance.jpg" },
];

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

const AUTOPLAY_MS = 5000;

/** Coverflow carousel: centre card is large, neighbours shrink and dim behind it. */
const BlogCarousel: React.FC = () => {
  const n = blogs.length;
  const [active, setActive] = useState(0);

  // Fully automatic: moves to the next article every 5 seconds (skipped for reduced motion)
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;
    const id = window.setInterval(() => setActive((prev) => (prev + 1) % n), AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, [n]);

  return (
    <div>
      <div
        className="hcx-cf relative mx-auto h-[470px] max-w-5xl select-none overflow-hidden sm:h-[520px]"
        role="region"
        aria-roledescription="carousel"
        aria-label="Blog articles"
      >
        {blogs.map((b, i) => {
          let o = (i - active + n) % n;
          if (o > n / 2) o -= n;
          const abs = Math.abs(o);
          const center = o === 0;

          const style: React.CSSProperties = {
            transform: `translateX(${-50 + o * 64}%) scale(${1 - abs * 0.13})`,
            zIndex: 10 - abs,
            opacity: abs > 2 ? 0 : abs === 2 ? 0.6 : 1,
            filter: center ? "none" : `brightness(${abs === 1 ? 0.72 : 0.6}) saturate(0.85)`,
            pointerEvents: center ? "auto" : "none",
          };

          return (
            <article
              key={b.id}
              className={`hcx-cf-card ${
                center
                  ? "shadow-[0_30px_60px_-20px_rgba(30,27,110,0.6)] ring-2 ring-[#ff8a3d]"
                  : "ring-1 ring-white/40"
              }`}
              style={style}
              data-far={abs === 2}
              aria-hidden={abs > 2}
            >
              <img src={b.image} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#14124f] via-[#14124f]/35 to-transparent" />

              <div className="relative flex h-full flex-col justify-between p-5">
                <div className="flex items-start justify-between gap-2">
                  <span className="rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-[#4338ca] shadow-sm">
                    {b.category}
                  </span>
                  <span
                    className={`rounded-full bg-[#ff8a3d] px-3 py-1 text-xs font-bold text-[#1b1b3a] shadow-sm transition-all duration-500 ${
                      center ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0"
                    }`}
                  >
                    {b.readTime} read
                  </span>
                </div>

                <div>
                  <h3 className={`display hcx-clamp2 font-bold leading-tight text-white ${center ? "text-2xl" : "text-lg"}`}>
                    {b.title}
                  </h3>

                  <div
                    className={`overflow-hidden transition-all duration-500 ${
                      center ? "max-h-56 translate-y-0 opacity-100" : "max-h-0 translate-y-3 opacity-0"
                    }`}
                  >
                    <p className="mt-3 text-sm leading-6 text-indigo-100">{b.excerpt}</p>
                    <Link
                      to={`/blog/${b.id}`}
                      tabIndex={center ? 0 : -1}
                      className="group mt-5 inline-flex items-center gap-2 rounded-xl bg-[#ff8a3d] px-5 py-3 text-sm font-bold text-[#1b1b3a] shadow-lg transition duration-300 hover:bg-white"
                    >
                      Read article
                      <span className="transition-transform duration-300 group-hover:translate-x-1" aria-hidden>→</span>
                    </Link>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* Progress indicator (display only, no controls) */}
      <div className="mt-8 flex items-center justify-center gap-2" aria-hidden>
        {blogs.map((b, i) => (
          <span
            key={b.id}
            className={`relative h-2.5 overflow-hidden rounded-full bg-[#4338ca]/20 transition-all duration-500 ${
              i === active ? "w-10" : "w-2.5"
            }`}
          >
            {i === active && (
              <span
                className="hcx-fill absolute inset-0 origin-left rounded-full bg-[#ff8a3d]"
                style={{ animationDuration: `${AUTOPLAY_MS}ms` }}
              />
            )}
          </span>
        ))}
      </div>
    </div>
  );
};

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
          <img
            src="/images/home-cleaning.jpg"
            alt="A professional cleaning a bright living room"
            className="hcx-zoom absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/80 to-white/0" />

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

              {/* Search / booking bar (your existing component) */}
              <div
                className="hcx-in hcx-search mt-8 flex items-center rounded-3xl bg-white p-5 shadow-[0_20px_50px_-20px_rgba(67,56,202,0.45)] ring-1 ring-[#4338ca]/10 sm:p-6"
                style={{ animationDelay: "0.8s" }}
              >
                <div className="w-full">
                  <HeroSearch />
                </div>
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

      {/* ================= POPULAR CATEGORIES ================= */}
      <section className="bg-white py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-6">
          <SectionHead
            title="Popular categories"
            text="Explore our most requested home services and find the right professional for your needs."
          />

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {popularCategories.map((c, i) => (
              <Reveal key={c.id} delay={i * 90}>
                <Link
                  to={`/services/${c.id}`}
                  {...tilt}
                  className="group flex h-full flex-col overflow-hidden rounded-3xl bg-white ring-1 ring-[#4338ca]/10 transition duration-500 hover:-translate-y-2 hover:shadow-[0_30px_60px_-25px_rgba(67,56,202,0.45)] hover:ring-[#4338ca]/30"
                >
                  <div className="relative h-44 overflow-hidden">
                    <img
                      src={c.image}
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#14124f]/50 via-transparent to-transparent" />
                    <span className="absolute left-4 top-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-xl shadow-lg transition duration-500 group-hover:-rotate-6 group-hover:bg-[#ff8a3d]" aria-hidden>
                      {c.icon}
                    </span>
                  </div>

                  <div className="flex flex-1 flex-col p-6">
                    <h3 className="display text-xl font-bold text-[#1e1b6e]">{c.title}</h3>
                    <p className="hcx-clamp2 mt-2 flex-1 text-sm leading-6 text-[#5b5b7a]">{c.description}</p>

                    <div className="mt-5 flex items-center justify-between border-t border-[#4338ca]/10 pt-4">
                      <span className="rounded-full bg-[#eef0ff] px-3 py-1 text-xs font-bold text-[#4338ca]">
                        {c.count} {c.count === 1 ? "service" : "services"}
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-sm font-bold text-[#4338ca] group-hover:text-[#e06a12]">
                        View
                        <span className="transition-transform duration-300 group-hover:translate-x-1.5" aria-hidden>→</span>
                      </span>
                    </div>
                  </div>
                </Link>
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

      {/* ================= BLOG ================= */}
      <section className="bg-white py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-6">
          <SectionHead
            title="Tips and advice for your home"
            text="Practical guides from the HomeCareX team to help you care for your home."
          />

          <Reveal>
            <BlogCarousel />
          </Reveal>

          <Reveal className="mt-10 text-center">
            <Link
              to="/blog"
              className="group inline-flex items-center gap-2 rounded-xl border-2 border-[#4338ca] px-7 py-3.5 font-bold text-[#4338ca] transition duration-300 hover:-translate-y-0.5 hover:bg-[#4338ca] hover:text-white"
            >
              View all articles
              <span className="transition-transform duration-300 group-hover:translate-x-1" aria-hidden>→</span>
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ================= FAQ ================= */}
      <section className="bg-[#eef0ff] py-20 sm:py-28">
        <div className="mx-auto max-w-3xl px-6">
          <SectionHead title="Frequently asked questions" text="Everything you need to know about HomeCareX." />

          <div className="space-y-4">
            {faqs.map((f, i) => {
              const open = openFaq === i;
              return (
                <Reveal key={f.question} delay={i * 70}>
                  <div className={`rounded-2xl bg-white transition duration-300 ${open ? "shadow-lg ring-2 ring-[#4338ca]/30" : "shadow-sm ring-1 ring-[#4338ca]/10 hover:ring-[#4338ca]/30"}`}>
                    <h3>
                      <button
                        type="button"
                        onClick={() => setOpenFaq(open ? null : i)}
                        aria-expanded={open}
                        aria-controls={`faq-panel-${i}`}
                        id={`faq-btn-${i}`}
                        className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                      >
                        <span className="text-lg font-bold text-[#1e1b6e]">{f.question}</span>
                        <span
                          className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-xl font-bold transition duration-300 ${
                            open ? "rotate-45 bg-[#ff8a3d] text-white" : "bg-[#ff8a3d]/15 text-[#e06a12]"
                          }`}
                          aria-hidden
                        >
                          +
                        </span>
                      </button>
                    </h3>
                    <div id={`faq-panel-${i}`} role="region" aria-labelledby={`faq-btn-${i}`} className={`hcx-acc ${open ? "open" : ""}`}>
                      <div>
                        <p className="px-6 pb-6 leading-7 text-[#5b5b7a]">{f.answer}</p>
                      </div>
                    </div>
                  </div>
                </Reveal>
              );
            })}
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
                  to="/register"
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