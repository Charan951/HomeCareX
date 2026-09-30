import React, { useEffect, useRef, useState } from "react";

interface StatItem {
  id: string;
  icon: string;
  title: string;
  description: string;
}

const STATS: StatItem[] = [
  { id: "STAT001", icon: "📅", title: "Easy Booking", description: "Find and book the service you need with ease." },
  { id: "STAT002", icon: "⏰", title: "Flexible Scheduling", description: "Choose a convenient time for your service." },
  { id: "STAT003", icon: "🏠", title: "Home Convenience", description: "Get the services you need at your doorstep." },
  { id: "STAT004", icon: "✨", title: "Simple Experience", description: "Manage your home service journey in one place." },
];

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
    }, { threshold, rootMargin: "0px 0px -40px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return [ref, seen] as const;
}

/**
 * Same look as the stats band on the Home page: a white rounded card with a soft
 * indigo shadow, dividers between items, and #eef0ff icon tiles. It overlaps the
 * section above it by 40px, exactly like the Home version.
 */
const StatsStrip: React.FC = () => {
  const [ref, seen] = useSeen<HTMLDivElement>();

  return (
    <div className="relative z-10 -mt-10 px-6">
      <div
        ref={ref}
        className="mx-auto max-w-6xl"
        style={{
          opacity: seen ? 1 : 0,
          transform: seen ? "none" : "translateY(24px)",
          transition: "opacity .8s cubic-bezier(.2,.7,.2,1), transform .8s cubic-bezier(.2,.7,.2,1)",
        }}
      >
        <dl className="grid grid-cols-1 divide-y divide-[#4338ca]/10 rounded-3xl bg-white p-2 shadow-[0_30px_60px_-25px_rgba(67,56,202,0.35)] ring-1 ring-[#4338ca]/10 sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 lg:divide-x">
          {STATS.map((stat, i) => (
            <div
              key={stat.id}
              className="group flex items-start gap-4 rounded-2xl px-6 py-7 transition duration-500 hover:bg-[#eef0ff]"
              style={{
                opacity: seen ? 1 : 0,
                transform: seen ? "none" : "translateY(16px)",
                transition: `opacity .7s ease ${200 + i * 110}ms, transform .7s cubic-bezier(.2,.7,.2,1) ${200 + i * 110}ms, background-color .5s`,
              }}
            >
              <span
                className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-[#eef0ff] text-2xl transition duration-500 group-hover:-rotate-6 group-hover:scale-110 group-hover:bg-[#ff8a3d]"
                aria-hidden
              >
                {stat.icon}
              </span>
              <div>
                <dt className="display text-lg font-extrabold text-[#4338ca]">{stat.title}</dt>
                <dd className="mt-1 text-sm leading-6 text-[#5b5b7a]">{stat.description}</dd>
              </div>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
};

export default StatsStrip;