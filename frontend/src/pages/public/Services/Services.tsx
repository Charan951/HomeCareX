import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

/* =========================================================
   STYLES (same design tokens as Home.tsx and About.tsx)
   Indigo #4338ca = structure and text, Orange #ff8a3d = action
========================================================= */

const styles = `
@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,800&family=DM+Sans:wght@400;500;700&display=swap');

.hcx-svc { font-family: 'DM Sans', system-ui, sans-serif; color: #1b1b3a; }
.hcx-svc h1, .hcx-svc h2, .hcx-svc h3, .hcx-svc .display {
  font-family: 'Bricolage Grotesque', 'DM Sans', system-ui, sans-serif;
  letter-spacing: -0.02em;
}

@keyframes sv-word { from { opacity: 0; transform: translateY(0.5em); filter: blur(6px); } to { opacity: 1; transform: none; filter: blur(0); } }
@keyframes sv-fade { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
@keyframes sv-drift { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(30px,-24px) scale(1.08); } }

.sv-word { display: inline-block; opacity: 0; animation: sv-word .8s cubic-bezier(.2,.7,.2,1) forwards; }
.sv-in { opacity: 0; animation: sv-fade .8s cubic-bezier(.2,.7,.2,1) forwards; }
.sv-drift { animation: sv-drift 14s ease-in-out infinite; }

.sv-reveal { opacity: 0; transform: translateY(28px); transition: opacity .8s cubic-bezier(.2,.7,.2,1), transform .8s cubic-bezier(.2,.7,.2,1); }
.sv-reveal.is-in { opacity: 1; transform: none; }

.hcx-svc a:focus-visible { outline: 3px solid #ff8a3d; outline-offset: 3px; border-radius: 10px; }

@media (prefers-reduced-motion: reduce) {
  .hcx-svc *, .hcx-svc *::before, .hcx-svc *::after { animation: none !important; transition: none !important; }
  .sv-word, .sv-in, .sv-reveal { opacity: 1 !important; transform: none !important; }
}
`;

/* =========================================================
   DATA
========================================================= */

const services = [
  { id: "home-cleaning", title: "Home Cleaning", icon: "✨", description: "Professional cleaning to keep your home clean, fresh and comfortable.", image: "/images/home-cleaning.jpg" },
  { id: "plumbing", title: "Plumbing Services", icon: "🔧", description: "Reliable plumbing for leaks, repairs, installations and maintenance.", image: "/images/plumbing.jpg" },
  { id: "electrical", title: "Electrical Services", icon: "⚡", description: "Safe and professional electrical services for your home.", image: "/images/electrical.jpg" },
  { id: "painting", title: "Painting Services", icon: "🎨", description: "Professional painting that gives your home a fresh and beautiful look.", image: "/images/painting.jpg" },
  { id: "appliance-repair", title: "Appliance Repair", icon: "🛠️", description: "Quick and reliable repair for your household appliances.", image: "/images/appliance-repair.jpg" },
  { id: "home-maintenance", title: "Home Maintenance", icon: "🏠", description: "Complete maintenance to keep your home safe and comfortable.", image: "/images/home-maintenance.jpg" },
];

/* =========================================================
   HELPERS
========================================================= */

/** Returns [ref, seen]. `seen` turns true once the element scrolls into view. */
function useInView<T extends HTMLElement>(threshold = 0.12) {
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

interface RevealProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

const Reveal: React.FC<RevealProps> = ({ children, delay = 0, className = "" }) => {
  const [ref, seen] = useInView<HTMLDivElement>();
  return (
    <div
      ref={ref}
      className={`sv-reveal ${seen ? "is-in" : ""} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

/* =========================================================
   PAGE
========================================================= */

const Services: React.FC = () => {
  const headline = ["Professional", "home", "services"];

  return (
    <div className="hcx-svc min-h-screen overflow-x-hidden bg-white">
      <style>{styles}</style>

      {/* ================= HERO ================= */}
      <section className="relative isolate overflow-hidden bg-gradient-to-b from-[#eef0ff] to-white">
        <div className="sv-drift pointer-events-none absolute -right-32 -top-32 -z-10 h-96 w-96 rounded-full bg-[#ff8a3d]/20 blur-3xl" />
        <div
          className="sv-drift pointer-events-none absolute -bottom-40 -left-32 -z-10 h-96 w-96 rounded-full bg-[#4338ca]/20 blur-3xl"
          style={{ animationDelay: "-7s" }}
        />

        <div className="mx-auto max-w-7xl px-6 py-20 text-center sm:py-24 lg:py-28">
          <p
            className="sv-in inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-[#4338ca] shadow-sm ring-1 ring-[#4338ca]/10"
            style={{ animationDelay: "0.05s" }}
          >
            <span className="h-2 w-2 rounded-full bg-[#ff8a3d]" />
            Our services
          </p>

          <h1 className="mt-6 text-5xl font-extrabold leading-[1.05] text-[#1e1b6e] sm:text-6xl lg:text-7xl">
            {headline.map((word, i) => (
              <span
                key={word}
                className={`sv-word mr-[0.25em] ${i >= 1 ? "text-[#4338ca]" : ""}`}
                style={{ animationDelay: `${0.15 + i * 0.1}s` }}
              >
                {word}
              </span>
            ))}
          </h1>

          <p
            className="sv-in mx-auto mt-6 max-w-2xl text-lg leading-8 text-[#5b5b7a]"
            style={{ animationDelay: "0.55s" }}
          >
            Reliable and convenient services designed to keep your home clean, safe and comfortable.
          </p>
        </div>
      </section>

      {/* ================= SERVICES GRID ================= */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service, i) => (
              <Reveal key={service.id} delay={(i % 3) * 100}>
                <article className="group flex h-full flex-col overflow-hidden rounded-3xl bg-white ring-1 ring-[#4338ca]/10 transition duration-500 hover:-translate-y-2 hover:shadow-[0_30px_60px_-25px_rgba(67,56,202,0.45)] hover:ring-[#4338ca]/30">
                  <div className="relative h-56 overflow-hidden">
                    <img
                      src={service.image}
                      alt={service.title}
                      loading="lazy"
                      className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#1e1b6e]/60 via-transparent to-transparent" />
                    <span
                      className="absolute bottom-4 left-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-xl shadow-lg transition duration-500 group-hover:-rotate-6 group-hover:bg-[#ff8a3d]"
                      aria-hidden
                    >
                      {service.icon}
                    </span>
                  </div>

                  <div className="flex flex-1 flex-col p-7">
                    <h2 className="text-xl font-bold text-[#1e1b6e]">{service.title}</h2>
                    <p className="mt-3 flex-1 leading-7 text-[#5b5b7a]">{service.description}</p>

                    <div className="mt-6 flex items-center justify-between gap-4">
                      <Link
                        to="/contact"
                        className="inline-flex items-center gap-2 rounded-lg bg-[#4338ca] px-5 py-2.5 text-sm font-bold text-white transition duration-300 hover:bg-[#ff8a3d] hover:text-[#1b1b3a]"
                      >
                        Request service
                        <span className="transition-transform duration-300 group-hover:translate-x-1" aria-hidden>
                          →
                        </span>
                      </Link>
                      <Link
                        to={`/services/${service.id}`}
                        className="text-sm font-bold text-[#4338ca] underline-offset-4 hover:text-[#e06a12] hover:underline"
                      >
                        Details
                      </Link>
                    </div>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ================= CTA ================= */}
      <section className="relative isolate overflow-hidden bg-[#eef0ff] px-6 py-20 sm:py-28">
        <div className="sv-drift pointer-events-none absolute -right-32 -top-32 -z-10 h-96 w-96 rounded-full bg-[#ff8a3d]/15 blur-3xl" />
        <div
          className="sv-drift pointer-events-none absolute -bottom-32 -left-32 -z-10 h-96 w-96 rounded-full bg-[#4338ca]/15 blur-3xl"
          style={{ animationDelay: "-6s" }}
        />

        <Reveal>
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="mx-auto max-w-2xl text-3xl font-extrabold leading-tight text-[#1e1b6e] sm:text-4xl lg:text-5xl">
              Need help with your home?
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-lg leading-8 text-[#5b5b7a]">
              Choose the right service and let HomeCareX make your home care simple and convenient.
            </p>

            <div className="mt-9 flex justify-center">
              <Link
                to="/contact"
                className="rounded-xl bg-[#ff8a3d] px-8 py-4 font-bold text-[#1b1b3a] shadow-[0_10px_30px_-10px_rgba(255,138,61,0.9)] transition duration-300 hover:-translate-y-0.5 hover:bg-[#ff7a22]"
              >
                Contact us
              </Link>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
};

export default Services;