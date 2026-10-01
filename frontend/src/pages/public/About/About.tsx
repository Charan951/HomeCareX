import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

/* =========================================================
   STYLES (same design tokens as Home.tsx)
   Indigo #4338ca = structure and text, Orange #ff8a3d = action
========================================================= */

const styles = `
@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,800&family=DM+Sans:wght@400;500;700&display=swap');

.hcx-about { font-family: 'DM Sans', system-ui, sans-serif; color: #1b1b3a; }
.hcx-about h1, .hcx-about h2, .hcx-about h3, .hcx-about .display {
  font-family: 'Bricolage Grotesque', 'DM Sans', system-ui, sans-serif;
  letter-spacing: -0.02em;
}

@keyframes ab-word { from { opacity: 0; transform: translateY(0.5em); filter: blur(6px); } to { opacity: 1; transform: none; filter: blur(0); } }
@keyframes ab-fade { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
@keyframes ab-drift { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(30px,-24px) scale(1.08); } }
@keyframes ab-float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }

.ab-word { display: inline-block; opacity: 0; animation: ab-word .8s cubic-bezier(.2,.7,.2,1) forwards; }
.ab-in { opacity: 0; animation: ab-fade .8s cubic-bezier(.2,.7,.2,1) forwards; }
.ab-drift { animation: ab-drift 14s ease-in-out infinite; }
.ab-float { animation: ab-float 6s ease-in-out infinite; }

.ab-reveal { opacity: 0; transform: translateY(24px); transition: opacity .8s cubic-bezier(.2,.7,.2,1), transform .8s cubic-bezier(.2,.7,.2,1); }
.ab-reveal.is-in { opacity: 1; transform: none; }

/* Image slides in from the left, text from the right */
.ab-reveal.from-left { transform: translateX(-40px); }
.ab-reveal.from-right { transform: translateX(40px); }
.ab-reveal.from-left.is-in, .ab-reveal.from-right.is-in { transform: none; }

.hcx-about a:focus-visible { outline: 3px solid #ff8a3d; outline-offset: 3px; border-radius: 10px; }

@media (prefers-reduced-motion: reduce) {
  .hcx-about *, .hcx-about *::before, .hcx-about *::after { animation: none !important; transition: none !important; }
  .ab-word, .ab-in, .ab-reveal { opacity: 1 !important; transform: none !important; }
}
`;

/* =========================================================
   DATA
========================================================= */

const values = [
  { icon: "✓", title: "Reliability", text: "We focus on providing dependable home service solutions.", tone: "indigo" },
  { icon: "★", title: "Quality", text: "We aim to make every home service experience simple and professional.", tone: "orange" },
  { icon: "♥", title: "Customer care", text: "We put convenience and customer needs at the center of the experience.", tone: "indigo" },
];

/* =========================================================
   HELPERS
========================================================= */

/** Returns [ref, seen]. `seen` turns true once the element scrolls into view. */
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

interface RevealProps {
  children: React.ReactNode;
  delay?: number;
  direction?: "up" | "left" | "right";
  className?: string;
}

const Reveal: React.FC<RevealProps> = ({ children, delay = 0, direction = "up", className = "" }) => {
  const [ref, seen] = useInView<HTMLDivElement>();
  const dir = direction === "left" ? "from-left" : direction === "right" ? "from-right" : "";

  return (
    <div
      ref={ref}
      className={`ab-reveal ${dir} ${seen ? "is-in" : ""} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

/* =========================================================
   PAGE
========================================================= */

const About: React.FC = () => {
  const headline = ["Your", "home,", "our", "care"];

  return (
    <div className="hcx-about overflow-x-hidden bg-white">
      <style>{styles}</style>

      {/* ================= HERO ================= */}
      <section className="relative isolate overflow-hidden bg-gradient-to-b from-[#eef0ff] to-white">
        <div className="ab-drift pointer-events-none absolute -right-32 -top-32 -z-10 h-96 w-96 rounded-full bg-[#ff8a3d]/20 blur-3xl" />
        <div
          className="ab-drift pointer-events-none absolute -bottom-40 -left-32 -z-10 h-96 w-96 rounded-full bg-[#4338ca]/20 blur-3xl"
          style={{ animationDelay: "-7s" }}
        />

        <div className="mx-auto max-w-7xl px-6 py-20 text-center sm:py-24 lg:py-28">
          <p
            className="ab-in inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-[#4338ca] shadow-sm ring-1 ring-[#4338ca]/10"
            style={{ animationDelay: "0.05s" }}
          >
            <span className="h-2 w-2 rounded-full bg-[#ff8a3d]" />
            About HomeCareX
          </p>

          <h1 className="mt-6 text-5xl font-extrabold leading-[1.05] text-[#1e1b6e] sm:text-6xl lg:text-7xl">
            {headline.map((word, i) => (
              <span
                key={word}
                className={`ab-word mr-[0.25em] ${i >= 2 ? "text-[#4338ca]" : ""}`}
                style={{ animationDelay: `${0.15 + i * 0.1}s` }}
              >
                {word}
              </span>
            ))}
          </h1>

          <p
            className="ab-in mx-auto mt-6 max-w-2xl text-lg leading-8 text-[#5b5b7a]"
            style={{ animationDelay: "0.65s" }}
          >
            HomeCareX makes it easier to find reliable services for your everyday home needs.
          </p>
        </div>
      </section>

      {/* ================= WHO WE ARE ================= */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto grid max-w-7xl items-center gap-14 px-6 lg:grid-cols-2 lg:gap-20">
          {/* Image */}
          <Reveal direction="left">
            <div className="relative mx-auto w-full max-w-xl lg:max-w-none">
              <div className="absolute -bottom-5 -right-5 h-full w-full rounded-[28px] bg-[#ff8a3d]" aria-hidden />
              <div className="group relative overflow-hidden rounded-[28px] bg-white shadow-2xl ring-1 ring-black/5">
                <img
                  src="/images/home-maintenance.jpg"
                  alt="A HomeCareX professional carrying out home maintenance"
                  loading="lazy"
                  className="h-[340px] w-full object-cover transition duration-700 group-hover:scale-105 sm:h-[420px]"
                />
              </div>
              <div className="ab-float absolute -left-4 bottom-10 rounded-2xl bg-white px-5 py-4 shadow-xl ring-1 ring-black/5 sm:-left-8">
                <p className="text-xs font-medium text-[#5b5b7a]">Home services</p>
                <p className="display text-lg font-bold text-[#4338ca]">All in one place</p>
              </div>
            </div>
          </Reveal>

          {/* Content */}
          <Reveal direction="right" delay={120}>
            <div>
              <h2 className="text-3xl font-extrabold leading-[1.1] text-[#1e1b6e] sm:text-4xl lg:text-5xl">
                Making home care simple
              </h2>

              <p className="mt-6 text-lg leading-8 text-[#5b5b7a]">
                HomeCareX is a home service platform designed to make everyday home maintenance
                easier and more convenient.
              </p>
              <p className="mt-4 text-lg leading-8 text-[#5b5b7a]">
                From cleaning and plumbing to electrical services, painting, appliance repair and
                maintenance, we bring different home service needs together in one convenient place.
              </p>

              <Link
                to="/services"
                className="group mt-8 inline-flex items-center gap-2 rounded-xl bg-[#ff8a3d] px-7 py-4 font-bold text-[#1b1b3a] shadow-[0_10px_30px_-10px_rgba(255,138,61,0.9)] transition duration-300 hover:-translate-y-0.5 hover:bg-[#ff7a22]"
              >
                Explore services
                <span className="transition-transform duration-300 group-hover:translate-x-1" aria-hidden>
                  →
                </span>
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ================= VALUES ================= */}
      <section className="bg-[#eef0ff] py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-6">
          <Reveal className="mx-auto mb-14 max-w-2xl text-center">
            <h2 className="text-3xl font-extrabold text-[#1e1b6e] sm:text-4xl lg:text-[2.75rem] lg:leading-[1.1]">
              What we focus on
            </h2>
            <p className="mt-4 text-lg leading-8 text-[#5b5b7a]">
              The principles behind every service we offer.
            </p>
          </Reveal>

          <div className="grid gap-6 md:grid-cols-3">
            {values.map((v, i) => (
              <Reveal key={v.title} delay={i * 120}>
                <div className="group h-full rounded-3xl bg-white p-9 text-center shadow-sm ring-1 ring-[#4338ca]/10 transition duration-500 hover:-translate-y-2 hover:shadow-xl">
                  <div
                    className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl text-2xl font-bold text-white shadow-md transition duration-500 group-hover:rotate-6 group-hover:scale-110 ${
                      v.tone === "orange"
                        ? "bg-[#ff8a3d] group-hover:bg-[#4338ca]"
                        : "bg-[#4338ca] group-hover:bg-[#ff8a3d]"
                    }`}
                    aria-hidden
                  >
                    {v.icon}
                  </div>
                  <h3 className="mt-6 text-xl font-bold text-[#1e1b6e]">{v.title}</h3>
                  <p className="mt-3 leading-7 text-[#5b5b7a]">{v.text}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ================= CTA ================= */}
      <section className="relative isolate overflow-hidden bg-white px-6 py-20 sm:py-28">
        <div className="ab-drift pointer-events-none absolute -right-32 -top-32 -z-10 h-96 w-96 rounded-full bg-[#ff8a3d]/15 blur-3xl" />
        <div
          className="ab-drift pointer-events-none absolute -bottom-32 -left-32 -z-10 h-96 w-96 rounded-full bg-[#4338ca]/15 blur-3xl"
          style={{ animationDelay: "-6s" }}
        />

        <Reveal>
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="mx-auto max-w-2xl text-3xl font-extrabold leading-tight text-[#1e1b6e] sm:text-4xl lg:text-5xl">
              Let us take care of your home
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-lg leading-8 text-[#5b5b7a]">
              Explore our services and find the right solution for your home.
            </p>

            <div className="mt-9 flex justify-center">
              <Link
                to="/services"
                className="rounded-xl bg-[#ff8a3d] px-8 py-4 font-bold text-[#1b1b3a] shadow-[0_10px_30px_-10px_rgba(255,138,61,0.9)] transition duration-300 hover:-translate-y-0.5 hover:bg-[#ff7a22]"
              >
                Explore services
              </Link>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
};

export default About;