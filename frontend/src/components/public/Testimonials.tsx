import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";

/* =====================================================================
 * TYPES & DATA
 * ===================================================================== */

export interface Testimonial {
  id: string;
  name: string; // customer
  service: string; // service the customer booked
  review: string;
  rating: number; // 1 to 5
}

const DEFAULT_TESTIMONIALS: Testimonial[] = [
  {
    id: "TEST001",
    name: "Priya Sharma",
    service: "Home Cleaning",
    review:
      "The service was easy to book and the professional arrived on time. Very convenient experience.",
    rating: 5,
  },
  {
    id: "TEST002",
    name: "Rahul Kumar",
    service: "Plumbing Services",
    review:
      "I found the service I needed quickly. The overall booking experience was simple and smooth.",
    rating: 4,
  },
  {
    id: "TEST003",
    name: "Ananya Reddy",
    service: "Home Maintenance",
    review:
      "HomeCareX made it easy to find a suitable home service. I would use the platform again.",
    rating: 5,
  },
];

const clampRating = (n: number) => Math.min(5, Math.max(0, n));

const initials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

/* =====================================================================
 * HOOKS
 * ===================================================================== */

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return reduced;
}

/** True once the element has scrolled into view (runs once). */
function useSeen<T extends HTMLElement>(threshold = 0.2) {
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
      { threshold }
    );

    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);

  return [ref, seen] as const;
}

/* =====================================================================
 * SMALL COMPONENTS
 * ===================================================================== */

const FadeIn: React.FC<{
  children: React.ReactNode;
  delay?: number;
  className?: string;
  reduced: boolean;
}> = ({ children, delay = 0, className = "", reduced }) => {
  const [ref, seen] = useSeen<HTMLDivElement>(0.12);
  const visible = seen || reduced;

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "none" : "translateY(28px)",
        filter: visible ? "blur(0)" : "blur(6px)",
        transition: reduced
          ? "none"
          : `opacity .8s cubic-bezier(.2,.7,.2,1) ${delay}ms, transform .8s cubic-bezier(.2,.7,.2,1) ${delay}ms, filter .8s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
};

/** Five stars, filled to any fraction (for example 4.7 out of 5). */
const StarRating: React.FC<{ value: number; className?: string }> = ({
  value,
  className = "text-xl",
}) => (
  <div
    className={`relative inline-block whitespace-nowrap leading-none tracking-widest ${className}`}
    role="img"
    aria-label={`${value.toFixed(1)} out of 5 stars`}
  >
    <div className="text-[#4338ca]/20" aria-hidden>
      ★★★★★
    </div>
    <div
      className="absolute inset-y-0 left-0 overflow-hidden text-[#ff8a3d]"
      style={{ width: `${(value / 5) * 100}%` }}
      aria-hidden
    >
      ★★★★★
    </div>
  </div>
);

const iconProps = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2.25,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

const ChevronLeft = () => (
  <svg {...iconProps}>
    <path d="M15 18l-6-6 6-6" />
  </svg>
);

const ChevronRight = () => (
  <svg {...iconProps}>
    <path d="M9 18l6-6-6-6" />
  </svg>
);

const QuoteIcon: React.FC<{ className?: string }> = ({ className = "" }) => (
  <svg
    className={className}
    width="72"
    height="72"
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden
  >
    <path d="M9.4 5C5.9 6.8 3.5 10 3.5 14.2 3.5 17 5.2 19 7.6 19c2 0 3.5-1.5 3.5-3.4 0-1.9-1.4-3.2-3.2-3.2-.3 0-.6 0-.8.1.3-2 1.8-4 4-5.2L9.4 5zm9.1 0c-3.5 1.8-5.9 5-5.9 9.2 0 2.8 1.7 4.8 4.1 4.8 2 0 3.5-1.5 3.5-3.4 0-1.9-1.4-3.2-3.2-3.2-.3 0-.6 0-.8.1.3-2 1.8-4 4-5.2L18.5 5z" />
  </svg>
);

const TagIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.25"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <path d="M20.6 13.4l-7.2 7.2a2 2 0 01-2.8 0L3 13V3h10l7.6 7.6a2 2 0 010 2.8z" />
    <circle cx="7.5" cy="7.5" r="1.2" fill="currentColor" stroke="none" />
  </svg>
);

const controlButton =
  "flex h-12 w-12 items-center justify-center rounded-full border-2 border-[#4338ca]/20 bg-white text-[#4338ca] shadow-sm transition duration-300 hover:border-[#4338ca] hover:bg-[#4338ca] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff8a3d] focus-visible:ring-offset-2";

/* =====================================================================
 * COMPONENT
 * ===================================================================== */

interface TestimonialsProps {
  testimonials?: Testimonial[];
}

const SWIPE_THRESHOLD_PX = 50;

const Testimonials: React.FC<TestimonialsProps> = ({
  testimonials = DEFAULT_TESTIMONIALS,
}) => {
  const reduced = usePrefersReducedMotion();
  const [summaryRef, summarySeen] = useSeen<HTMLDivElement>(0.3);
  const [index, setIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);

  const count = testimonials.length;

  /* Summary numbers are calculated from the reviews, so they stay correct */
  const stats = useMemo(() => {
    const total = testimonials.length;
    const average =
      total === 0
        ? 0
        : testimonials.reduce((sum, t) => sum + clampRating(t.rating), 0) / total;
    const breakdown = [5, 4, 3, 2, 1].map((star) => ({
      star,
      count: testimonials.filter((t) => Math.round(clampRating(t.rating)) === star)
        .length,
    }));
    return { total, average, breakdown };
  }, [testimonials]);

  /* Keep the index valid if the list changes */
  useEffect(() => {
    if (count > 0 && index >= count) setIndex(0);
  }, [count, index]);

  const goNext = useCallback(
    () => setIndex((i) => (count === 0 ? 0 : (i + 1) % count)),
    [count]
  );
  const goPrevious = useCallback(
    () => setIndex((i) => (count === 0 ? 0 : (i - 1 + count) % count)),
    [count]
  );

  /* Keyboard: left / right arrows, Home and End */
  const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    switch (event.key) {
      case "ArrowRight":
        event.preventDefault();
        goNext();
        break;
      case "ArrowLeft":
        event.preventDefault();
        goPrevious();
        break;
      case "Home":
        event.preventDefault();
        setIndex(0);
        break;
      case "End":
        event.preventDefault();
        setIndex(count - 1);
        break;
      default:
    }
  };

  /* Touch swipe */
  const handleTouchStart = (event: React.TouchEvent) => {
    touchStartX.current = event.touches[0].clientX;
  };

  const handleTouchEnd = (event: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const deltaX = event.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(deltaX) < SWIPE_THRESHOLD_PX) return;
    if (deltaX < 0) goNext();
    else goPrevious();
  };

  const current = testimonials[index];

  return (
    <section
      id="testimonials"
      aria-labelledby="testimonials-heading"
      className="relative overflow-hidden bg-[#eef0ff] py-20 sm:py-28"
    >
      <div
        className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-[#ff8a3d]/15 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-[#4338ca]/10 blur-3xl"
        aria-hidden
      />

      <div className="relative mx-auto max-w-7xl px-6">
        <FadeIn reduced={reduced} className="mx-auto mb-14 max-w-2xl text-center">
          <h2
            id="testimonials-heading"
            className="text-3xl font-extrabold text-[#1e1b6e] sm:text-4xl lg:text-[3.25rem] lg:leading-[1.05]"
          >
            What our customers say
          </h2>
          <p className="mt-4 text-lg leading-8 text-[#5b5b7a]">
            See what customers have to say about their HomeCareX experience.
          </p>
        </FadeIn>

        {/* ===================== EMPTY STATE ===================== */}
        {count === 0 ? (
          <FadeIn reduced={reduced}>
            <div className="mx-auto max-w-2xl rounded-3xl bg-white px-8 py-14 text-center shadow-[0_30px_60px_-30px_rgba(67,56,202,0.4)] ring-1 ring-[#4338ca]/10 sm:px-12">
              <span
                className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#fff3ea] text-[#ff8a3d] ring-8 ring-[#fff3ea]/60"
                aria-hidden
              >
                <svg
                  width="36"
                  height="36"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15a2 2 0 01-2 2H8l-5 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                  <path d="M12 7.5l1.2 2.4 2.6.4-1.9 1.8.5 2.6-2.4-1.3-2.4 1.3.5-2.6-1.9-1.8 2.6-.4L12 7.5z" />
                </svg>
              </span>

              <h3 className="display mt-6 text-2xl font-extrabold text-[#1e1b6e] sm:text-3xl">
                No reviews yet
              </h3>
              <p className="mx-auto mt-3 max-w-md text-lg leading-8 text-[#5b5b7a]">
                Be the first to share your experience with HomeCareX and help
                others choose with confidence.
              </p>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                <Link
                  to="/contact"
                  className="rounded-xl bg-[#ff8a3d] px-7 py-3.5 font-bold text-[#1b1b3a] shadow-[0_10px_30px_-10px_rgba(255,138,61,0.9)] transition duration-300 hover:-translate-y-0.5 hover:bg-[#ff7a22] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4338ca] focus-visible:ring-offset-2"
                >
                  Share your experience
                </Link>
                <Link
                  to="/services"
                  className="rounded-xl border-2 border-[#4338ca] px-7 py-3.5 font-bold text-[#4338ca] transition duration-300 hover:-translate-y-0.5 hover:bg-[#4338ca] hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff8a3d] focus-visible:ring-offset-2"
                >
                  Explore services
                </Link>
              </div>
            </div>
          </FadeIn>
        ) : (
          <div className="grid items-start gap-8 lg:grid-cols-[380px_minmax(0,1fr)]">
            {/* ===================== RATING SUMMARY ===================== */}
            <FadeIn reduced={reduced} className="lg:sticky lg:top-28">
              <div
                ref={summaryRef}
                className="rounded-3xl bg-white p-8 shadow-[0_30px_60px_-30px_rgba(67,56,202,0.4)] ring-1 ring-[#4338ca]/10"
              >
                <div className="flex items-end gap-4">
                  <p className="display text-7xl font-extrabold leading-none text-[#1e1b6e]">
                    {stats.average.toFixed(1)}
                  </p>
                  <p className="pb-2 text-lg font-bold text-[#5b5b7a]">out of 5</p>
                </div>

                <StarRating value={stats.average} className="mt-4 text-3xl" />
                <p className="mt-3 text-sm text-[#5b5b7a]">
                  Based on {stats.total} customer{" "}
                  {stats.total === 1 ? "review" : "reviews"}
                </p>

                <ul className="mt-7 space-y-3">
                  {stats.breakdown.map((row, i) => (
                    <li key={row.star} className="flex items-center gap-3 text-sm">
                      <span className="w-8 flex-shrink-0 font-bold text-[#1e1b6e]">
                        {row.star} ★
                      </span>
                      <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-[#4338ca]/10">
                        <span
                          className="block h-full rounded-full bg-gradient-to-r from-[#ff8a3d] to-[#ffb37a]"
                          style={{
                            width:
                              summarySeen || reduced
                                ? `${(row.count / stats.total) * 100}%`
                                : "0%",
                            transition: reduced
                              ? "none"
                              : `width 1.1s cubic-bezier(.2,.7,.2,1) ${i * 90}ms`,
                          }}
                        />
                      </span>
                      <span className="w-5 flex-shrink-0 text-right text-[#5b5b7a]">
                        {row.count}
                      </span>
                    </li>
                  ))}
                </ul>

                <Link
                  to="/contact"
                  className="mt-8 flex w-full items-center justify-center rounded-xl bg-[#ff8a3d] px-6 py-3.5 font-bold text-[#1b1b3a] shadow-[0_10px_30px_-10px_rgba(255,138,61,0.9)] transition duration-300 hover:-translate-y-0.5 hover:bg-[#ff7a22] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4338ca] focus-visible:ring-offset-2"
                >
                  Share your experience
                </Link>
              </div>
            </FadeIn>

            {/* ===================== REVIEW CAROUSEL ===================== */}
            <FadeIn reduced={reduced} delay={120}>
              <div
                role="group"
                aria-roledescription="carousel"
                aria-label="Customer reviews"
                tabIndex={0}
                onKeyDown={handleKeyDown}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
                className="rounded-3xl focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff8a3d] focus-visible:ring-offset-4 focus-visible:ring-offset-[#eef0ff]"
              >
                {/* All slides share one grid cell, so the card never jumps in height */}
                <div className="grid overflow-hidden rounded-3xl">
                  {testimonials.map((t, i) => {
                    const active = i === index;
                    const rating = clampRating(t.rating);

                    return (
                      <article
                        key={t.id}
                        role="group"
                        aria-roledescription="slide"
                        aria-label={`${i + 1} of ${count}`}
                        aria-hidden={!active}
                        className={`relative col-start-1 row-start-1 flex flex-col rounded-3xl bg-white p-7 ring-1 ring-[#4338ca]/10 shadow-[0_30px_60px_-30px_rgba(67,56,202,0.4)] sm:p-10 ${
                          active ? "visible" : "invisible"
                        }`}
                        style={{
                          opacity: active ? 1 : 0,
                          transform: reduced
                            ? "none"
                            : active
                              ? "translateX(0)"
                              : `translateX(${i < index ? "-48px" : "48px"})`,
                          transition: reduced
                            ? "none"
                            : "opacity .6s cubic-bezier(.2,.7,.2,1), transform .6s cubic-bezier(.2,.7,.2,1), visibility .6s",
                        }}
                      >
                        <QuoteIcon className="absolute right-6 top-6 text-[#ff8a3d]/20 sm:right-10 sm:top-8" />

                        {/* Rating + service */}
                        <div className="relative flex flex-wrap items-center gap-x-4 gap-y-3">
                          <StarRating value={rating} className="text-2xl" />
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#eef0ff] px-3.5 py-1.5 text-sm font-bold text-[#4338ca]">
                            <TagIcon />
                            {t.service}
                          </span>
                        </div>

                        {/* Review */}
                        <blockquote className="relative mt-6 flex-1">
                          <p className="text-xl font-medium leading-9 text-[#1b1b3a] sm:text-2xl sm:leading-10">
                            &ldquo;{t.review}&rdquo;
                          </p>
                        </blockquote>

                        {/* Customer */}
                        <footer className="relative mt-8 flex items-center gap-4 border-t border-[#4338ca]/10 pt-6">
                          <span
                            className="display flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#4338ca] to-[#ff8a3d] text-lg font-extrabold text-white shadow-md"
                            aria-hidden
                          >
                            {initials(t.name)}
                          </span>
                          <div>
                            <p className="display text-lg font-bold text-[#1e1b6e]">
                              {t.name}
                            </p>
                            <p className="flex items-center gap-1.5 text-sm text-[#5b5b7a]">
                              <span
                                className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white"
                                aria-hidden
                              >
                                ✓
                              </span>
                              HomeCareX customer
                            </p>
                          </div>
                        </footer>
                      </article>
                    );
                  })}
                </div>
              </div>

              {/* Controls (outside the focusable carousel group so Tab order stays simple) */}
              {count > 1 && (
                <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-5">
                    <p
                      className="text-sm font-bold tabular-nums text-[#1e1b6e]"
                      aria-hidden
                    >
                      {String(index + 1).padStart(2, "0")} /{" "}
                      {String(count).padStart(2, "0")}
                    </p>

                    <div
                      className="flex items-center gap-2"
                      role="group"
                      aria-label="Choose a review"
                    >
                      {testimonials.map((t, i) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setIndex(i)}
                          aria-label={`Show review ${i + 1} from ${t.name}`}
                          aria-current={i === index ? "true" : undefined}
                          className="group flex h-6 items-center focus:outline-none"
                        >
                          <span
                            className={`block h-2.5 rounded-full transition-all duration-300 group-focus-visible:ring-2 group-focus-visible:ring-[#ff8a3d] group-focus-visible:ring-offset-2 group-focus-visible:ring-offset-[#eef0ff] ${
                              i === index
                                ? "w-8 bg-[#ff8a3d]"
                                : "w-2.5 bg-[#4338ca]/25 group-hover:bg-[#4338ca]/50"
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <p className="hidden text-sm text-[#5b5b7a] md:block" aria-hidden>
                      Use{" "}
                      <kbd className="rounded-md border border-[#4338ca]/20 bg-white px-1.5 py-0.5 font-sans text-xs font-bold text-[#4338ca]">
                        ←
                      </kbd>{" "}
                      <kbd className="rounded-md border border-[#4338ca]/20 bg-white px-1.5 py-0.5 font-sans text-xs font-bold text-[#4338ca]">
                        →
                      </kbd>{" "}
                      to browse
                    </p>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={goPrevious}
                        aria-label="Previous review"
                        className={controlButton}
                      >
                        <ChevronLeft />
                      </button>
                      <button
                        type="button"
                        onClick={goNext}
                        aria-label="Next review"
                        className={controlButton}
                      >
                        <ChevronRight />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Screen readers hear which review is showing */}
              <p className="sr-only" aria-live="polite" aria-atomic="true">
                {`Review ${index + 1} of ${count} from ${current.name} for ${current.service}, rated ${clampRating(current.rating)} out of 5.`}
              </p>
            </FadeIn>
          </div>
        )}
      </div>
    </section>
  );
};

export default Testimonials;