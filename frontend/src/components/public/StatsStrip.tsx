import React, { useEffect, useRef, useState } from "react";

interface StatItem {
  id: string;
  icon: string;
  title: string;
  description: string;
}

/*
 * Initial / fallback statistics.
 * These will be displayed when the API has not provided
 * approved statistics yet.
 */
const INITIAL_STATS: StatItem[] = [
  {
    id: "STAT001",
    icon: "📅",
    title: "Easy Booking",
    description: "Find and book the service you need with ease.",
  },
  {
    id: "STAT002",
    icon: "⏰",
    title: "Flexible Scheduling",
    description: "Choose a convenient time for your service.",
  },
  {
    id: "STAT003",
    icon: "🏠",
    title: "Home Convenience",
    description: "Get the services you need at your doorstep.",
  },
  {
    id: "STAT004",
    icon: "✨",
    title: "Simple Experience",
    description: "Manage your home service journey in one place.",
  },
];

/**
 * True once the element has scrolled into view.
 * Runs only once.
 */
function useSeen<T extends HTMLElement>(threshold = 0.2) {
  const ref = useRef<T | null>(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const el = ref.current;

    if (!el) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSeen(true);
          observer.disconnect();
        }
      },
      {
        threshold,
        rootMargin: "0px 0px -40px 0px",
      }
    );

    observer.observe(el);

    return () => observer.disconnect();
  }, [threshold]);

  return [ref, seen] as const;
}

const StatsStrip: React.FC = () => {
  /*
   * Initial data is displayed immediately.
   */
  const [stats, setStats] = useState<StatItem[]>(INITIAL_STATS);

  const [ref, seen] = useSeen<HTMLDivElement>();

  /*
   * Later, replace this with your actual API call.
   *
   * If the API returns approved statistics,
   * setStats() will automatically update the UI.
   */
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/stats");

        if (!response.ok) {
          return;
        }

        const data: StatItem[] = await response.json();

        /*
         * Only replace the initial values when
         * valid data is returned.
         */
        if (Array.isArray(data) && data.length > 0) {
          setStats(data);
        }
      } catch (error) {
        /*
         * If the API is unavailable,
         * keep the initial statistics.
         */
        console.log("Using initial statistics:", error);
      }
    };

    fetchStats();
  }, []);

  /*
   * If there is no data at all, hide the section.
   */
  if (stats.length === 0) {
    return null;
  }

  return (
    <div className="relative z-10 -mt-10 px-6">
      <div
        ref={ref}
        className="mx-auto max-w-6xl"
        style={{
          opacity: seen ? 1 : 0,
          transform: seen ? "none" : "translateY(24px)",
          transition:
            "opacity .8s cubic-bezier(.2,.7,.2,1), transform .8s cubic-bezier(.2,.7,.2,1)",
        }}
      >
        <dl
          className="
            grid
            grid-cols-1
            divide-y
            divide-[#4338ca]/10
            rounded-3xl
            bg-white
            p-2
            shadow-[0_30px_60px_-25px_rgba(67,56,202,0.35)]
            ring-1
            ring-[#4338ca]/10
            sm:grid-cols-2
            sm:divide-y-0
            lg:grid-cols-4
            lg:divide-x
          "
        >
          {stats.map((stat, index) => (
            <div
              key={stat.id}
              className="
                group
                flex
                items-start
                gap-4
                rounded-2xl
                px-6
                py-7
                transition
                duration-500
                hover:bg-[#eef0ff]
              "
              style={{
                opacity: seen ? 1 : 0,
                transform: seen ? "none" : "translateY(16px)",
                transition: `opacity .7s ease ${
                  200 + index * 110
                }ms, transform .7s cubic-bezier(.2,.7,.2,1) ${
                  200 + index * 110
                }ms, background-color .5s`,
              }}
            >
              {/* Icon */}
              <span
                className="
                  flex
                  h-14
                  w-14
                  flex-shrink-0
                  items-center
                  justify-center
                  rounded-2xl
                  bg-[#eef0ff]
                  text-2xl
                  transition
                  duration-500
                  group-hover:-rotate-6
                  group-hover:scale-110
                  group-hover:bg-[#ff8a3d]
                "
                aria-hidden
              >
                {stat.icon}
              </span>

              {/* Content */}
              <div>
                <dt className="display text-lg font-extrabold text-[#4338ca]">
                  {stat.title}
                </dt>

                <dd className="mt-1 text-sm leading-6 text-[#5b5b7a]">
                  {stat.description}
                </dd>
              </div>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
};

export default StatsStrip;