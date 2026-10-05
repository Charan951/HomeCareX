import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

interface CategoryCardProps {
  id: string;
  name: string;
  description: string;
  image: string;
  serviceCount: number;
  link: string;
  /** Optional emoji or short icon shown on the image, e.g. "🔧" */
  icon?: string;
}

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Counts from 0 up to `target` once `start` becomes true. */
function useCountUp(target: number, start: boolean, duration = 1100) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!start) return undefined;

    if (prefersReducedMotion()) {
      setValue(target);
      return undefined;
    }

    let frameId = 0;
    const startTime = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out
      setValue(Math.round(target * eased));
      if (progress < 1) frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [target, start, duration]);

  return value;
}

const CategoryCard: React.FC<CategoryCardProps> = ({
  name,
  description,
  image,
  serviceCount,
  link,
  icon,
}) => {
  const cardRef = useRef<HTMLAnchorElement | null>(null);
  const [inView, setInView] = useState(false);
  const count = useCountUp(serviceCount, inView);

  /* Start the count-up when the card scrolls into view */
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  /* Cursor-following light + gentle 3D tilt (tilt is skipped for reduced motion) */
  const handleMouseMove = (event: React.MouseEvent<HTMLAnchorElement>) => {
    const el = event.currentTarget;
    const rect = el.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;

    el.style.setProperty("--mx", `${x * 100}%`);
    el.style.setProperty("--my", `${y * 100}%`);

    if (!prefersReducedMotion()) {
      el.style.transform = `perspective(900px) translateY(-8px) rotateX(${(0.5 - y) * 6}deg) rotateY(${(x - 0.5) * 8}deg)`;
    }
  };

  const handleMouseLeave = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.currentTarget.style.transform = "";
  };

  const label = serviceCount === 1 ? "service" : "services";

  return (
    <Link
      ref={cardRef}
      to={link}
      aria-label={`${name}, ${serviceCount} ${label}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="group relative block aspect-[4/5] w-full overflow-hidden rounded-3xl bg-[#1e1b6e] shadow-[0_20px_40px_-25px_rgba(30,27,110,0.55)] transition-[transform,box-shadow] duration-300 ease-out will-change-transform hover:shadow-[0_40px_80px_-30px_rgba(67,56,202,0.7)] focus:outline-none focus-visible:ring-4 focus-visible:ring-[#ff8a3d] focus-visible:ring-offset-2 motion-reduce:transition-none sm:aspect-[3/4]"
    >
      {/* ---------- Photo ---------- */}
      <img
        src={image}
        alt=""
        loading="lazy"
        decoding="async"
        draggable={false}
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-110 motion-reduce:transform-none motion-reduce:transition-none"
      />

      {/* Dark gradient so the text is always readable */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#14124f] via-[#14124f]/55 to-[#14124f]/5" />

      {/* Indigo tint that fades in on hover */}
      <div className="absolute inset-0 bg-[#4338ca]/0 transition-colors duration-500 group-hover:bg-[#4338ca]/25" />

      {/* Light that follows the cursor */}
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(320px circle at var(--mx, 50%) var(--my, 50%), rgba(255,255,255,0.22), transparent 60%)",
        }}
        aria-hidden
      />

      {/* Border that turns orange on hover */}
      <div
        className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-inset ring-white/15 transition duration-500 group-hover:ring-2 group-hover:ring-[#ff8a3d]/70"
        aria-hidden
      />

      {/* ---------- Top row: count + icon ---------- */}
      <div className="absolute inset-x-5 top-5 flex items-start justify-between">
        <span className="inline-flex items-center rounded-full border border-white/30 bg-white/20 px-3.5 py-1.5 text-xs font-bold tabular-nums text-white backdrop-blur-md">
          {count} {label}
        </span>

        {icon && (
          <span
            className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-xl shadow-lg transition duration-500 group-hover:-rotate-12 group-hover:scale-110 group-hover:bg-[#ff8a3d] motion-reduce:transform-none motion-reduce:transition-none"
            aria-hidden
          >
            {icon}
          </span>
        )}
      </div>

      {/* ---------- Bottom content ---------- */}
      <div className="absolute inset-x-0 bottom-0 p-6 transition-transform duration-500 ease-out group-hover:-translate-y-1 motion-reduce:transform-none motion-reduce:transition-none">
        <h3 className="text-2xl font-extrabold leading-tight tracking-tight text-white">
          {name}
        </h3>

        <p className="mt-2 line-clamp-2 text-sm leading-6 text-white/80">
          {description}
        </p>

        <div className="mt-5 flex items-center justify-between border-t border-white/20 pt-4">
          <span className="relative text-sm font-bold text-white">
            Explore services
            {/* Underline that draws itself on hover */}
            <span
              className="absolute -bottom-1 left-0 h-0.5 w-full origin-left scale-x-0 bg-[#ff8a3d] transition-transform duration-500 group-hover:scale-x-100 motion-reduce:scale-x-100 motion-reduce:transition-none"
              aria-hidden
            />
          </span>

          <span
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm transition duration-300 group-hover:bg-[#ff8a3d] motion-reduce:transition-none"
            aria-hidden
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-rotate-45 motion-reduce:transform-none"
            >
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </span>
        </div>
      </div>
    </Link>
  );
};

export default CategoryCard;