import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

interface Testimonial {
  id: string;
  name: string;
  review: string;
  rating: number;
}

const TESTIMONIALS: Testimonial[] = [
  {
    id: "TEST001",
    name: "Priya Sharma",
    review: "The service was easy to book and the professional arrived on time. Very convenient experience.",
    rating: 5,
  },
  {
    id: "TEST002",
    name: "Rahul Kumar",
    review: "I found the service I needed quickly. The overall booking experience was simple and smooth.",
    rating: 4,
  },
  {
    id: "TEST003",
    name: "Ananya Reddy",
    review: "HomeCareX made it easy to find a suitable home service. I would use the platform again.",
    rating: 5,
  },
];

/* The summary is calculated from the reviews above, so it stays correct when reviews change. */
const total = TESTIMONIALS.length;
const average = TESTIMONIALS.reduce((sum, t) => sum + t.rating, 0) / total;
const breakdown = [5, 4, 3, 2, 1].map((star) => ({
  star,
  count: TESTIMONIALS.filter((t) => t.rating === star).length,
}));

const initials = (name: string) =>
  name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

/** True once the element has scrolled into view (runs once). */
function useSeen<T extends HTMLElement>(threshold = 0.2) {
  const ref = useRef<T | null>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setSeen(true);
        io.disconnect();
      }
    }, { threshold });
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return [ref, seen] as const;
}

const FadeIn: React.FC<{ children: React.ReactNode; delay?: number; className?: string }> = ({ children, delay = 0, className = "" }) => {
  const [ref, seen] = useSeen<HTMLDivElement>(0.12);
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: seen ? 1 : 0,
        transform: seen ? "none" : "translateY(28px)",
        filter: seen ? "blur(0)" : "blur(6px)",
        transition: `opacity .8s cubic-bezier(.2,.7,.2,1) ${delay}ms, transform .8s cubic-bezier(.2,.7,.2,1) ${delay}ms, filter .8s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
};

/** Five stars, filled to any fraction (for example 4.7 out of 5). */
const StarRating: React.FC<{ value: number; className?: string }> = ({ value, className = "text-xl" }) => (
  <div className={`relative inline-block whitespace-nowrap leading-none tracking-widest ${className}`} role="img" aria-label={`${value.toFixed(1)} out of 5 stars`}>
    <div className="text-[#4338ca]/20">★★★★★</div>
    <div className="absolute inset-y-0 left-0 overflow-hidden text-[#ff8a3d]" style={{ width: `${(value / 5) * 100}%` }}>★★★★★</div>
  </div>
);

const Testimonials: React.FC = () => {
  const [summaryRef, summarySeen] = useSeen<HTMLDivElement>(0.3);

  return (
    <section className="relative overflow-hidden bg-[#eef0ff] py-20 sm:py-28">
      <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-[#ff8a3d]/15 blur-3xl" aria-hidden />

      <div className="relative mx-auto max-w-7xl px-6">
        <FadeIn className="mx-auto mb-14 max-w-2xl text-center">
          <h2 className="text-3xl font-extrabold text-[#1e1b6e] sm:text-4xl lg:text-[3.25rem] lg:leading-[1.05]">
            What our customers say
          </h2>
          <p className="mt-4 text-lg leading-8 text-[#5b5b7a]">
            See what customers have to say about their HomeCareX experience.
          </p>
        </FadeIn>

        <div className="grid items-start gap-8 lg:grid-cols-[380px_1fr]">
          {/* Rating summary */}
          <FadeIn className="lg:sticky lg:top-28">
            <div ref={summaryRef} className="rounded-3xl bg-white p-8 shadow-[0_30px_60px_-30px_rgba(67,56,202,0.4)] ring-1 ring-[#4338ca]/10">
              <div className="flex items-end gap-4">
                <p className="display text-7xl font-extrabold leading-none text-[#1e1b6e]">{average.toFixed(1)}</p>
                <p className="pb-2 text-lg font-bold text-[#5b5b7a]">out of 5</p>
              </div>
              <StarRating value={average} className="mt-4 text-3xl" />
              <p className="mt-3 text-sm text-[#5b5b7a]">
                Based on {total} customer {total === 1 ? "review" : "reviews"}
              </p>

              <ul className="mt-7 space-y-3">
                {breakdown.map((row, i) => (
                  <li key={row.star} className="flex items-center gap-3 text-sm">
                    <span className="w-8 flex-shrink-0 font-bold text-[#1e1b6e]">{row.star} ★</span>
                    <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-[#4338ca]/10">
                      <span
                        className="block h-full rounded-full bg-gradient-to-r from-[#ff8a3d] to-[#ffb37a]"
                        style={{
                          width: summarySeen ? `${(row.count / total) * 100}%` : "0%",
                          transition: `width 1.1s cubic-bezier(.2,.7,.2,1) ${i * 90}ms`,
                        }}
                      />
                    </span>
                    <span className="w-5 flex-shrink-0 text-right text-[#5b5b7a]">{row.count}</span>
                  </li>
                ))}
              </ul>

              <Link
                to="/contact"
                className="mt-8 flex w-full items-center justify-center rounded-xl bg-[#ff8a3d] px-6 py-3.5 font-bold text-[#1b1b3a] shadow-[0_10px_30px_-10px_rgba(255,138,61,0.9)] transition duration-300 hover:-translate-y-0.5 hover:bg-[#ff7a22]"
              >
                Share your experience
              </Link>
            </div>
          </FadeIn>

          {/* Reviews */}
          <div className="space-y-5">
            {TESTIMONIALS.map((t, i) => (
              <FadeIn key={t.id} delay={i * 110}>
                <article className="group rounded-3xl bg-white p-6 ring-1 ring-[#4338ca]/10 transition duration-500 hover:-translate-y-1 hover:shadow-xl hover:ring-[#ff8a3d]/50 sm:p-8">
                  <header className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <span className="display flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#4338ca] to-[#ff8a3d] text-base font-extrabold text-white shadow-md" aria-hidden>
                        {initials(t.name)}
                      </span>
                      <div>
                        <p className="display font-bold text-[#1e1b6e]">{t.name}</p>
                        <p className="flex items-center gap-1.5 text-sm text-[#5b5b7a]">
                          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white" aria-hidden>✓</span>
                          HomeCareX customer
                        </p>
                      </div>
                    </div>
                    <StarRating value={t.rating} />
                  </header>

                  <p className="mt-5 text-lg leading-8 text-[#1b1b3a]">{t.review}</p>
                </article>
              </FadeIn>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;