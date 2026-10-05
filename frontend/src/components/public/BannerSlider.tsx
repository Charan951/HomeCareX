import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

/* =====================================================================
 * TYPES & DATA
 * ===================================================================== */

export interface Banner {
  id: string;
  category: string;
  title: string;
  description: string;
  image: string; // served from /public, e.g. "/images/plumbing.jpg"
  alt: string;
  link: string;
}

const defaultBanners: Banner[] = [
  {
    id: "BANNER001",
    category: "Home maintenance",
    title: "Quality home services, from people you can trust",
    description:
      "Find reliable professionals for your everyday home service needs.",
    image: "/images/home-maintenance.jpg",
    alt: "Technician carrying out home maintenance work",
    link: "/services",
  },
  {
    id: "BANNER002",
    category: "Home cleaning",
    title: "A cleaner home, booked in minutes",
    description:
      "Choose a service, pick a convenient slot, and we take care of the rest.",
    image: "/images/home-cleaning.jpg",
    alt: "Professional cleaning a living room",
    link: "/services",
  },
  {
    id: "BANNER003",
    category: "Plumbing",
    title: "Leaks and blockages fixed right the first time",
    description:
      "Experienced plumbers for repairs, fittings and emergency callouts.",
    image: "/images/plumbing.jpg",
    alt: "Plumber repairing a pipe",
    link: "/services",
  },
  {
    id: "BANNER004",
    category: "Electrical",
    title: "Safe, certified electrical work at home",
    description:
      "From a single switch to full rewiring, book a qualified electrician.",
    image: "/images/electrical.jpg",
    alt: "Electrician working on a wiring panel",
    link: "/services",
  },
  {
    id: "BANNER005",
    category: "Painting",
    title: "Give your walls a fresh, clean finish",
    description:
      "Skilled painters for interiors and exteriors, with minimal mess.",
    image: "/images/painting.jpg",
    alt: "Painter painting a wall",
    link: "/services",
  },
  {
    id: "BANNER006",
    category: "Appliance repair",
    title: "Appliance repair at your doorstep",
    description:
      "Get your washing machine, fridge or AC working again without the hassle.",
    image: "/images/appliance-repair.jpg",
    alt: "Technician repairing a home appliance",
    link: "/services",
  },
];

const AUTOPLAY_MS = 3000;
const SWIPE_THRESHOLD_PX = 50;

/* =====================================================================
 * ICONS
 * ===================================================================== */

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

const ArrowRight = () => (
  <svg {...iconProps} width={18} height={18}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

const PauseIcon = () => (
  <svg {...iconProps} fill="currentColor" stroke="none">
    <rect x="6" y="5" width="4" height="14" rx="1" />
    <rect x="14" y="5" width="4" height="14" rx="1" />
  </svg>
);

const PlayIcon = () => (
  <svg {...iconProps} fill="currentColor" stroke="none">
    <path d="M8 5.5v13a1 1 0 001.5.86l10.5-6.5a1 1 0 000-1.72L9.5 4.64A1 1 0 008 5.5z" />
  </svg>
);

/* =====================================================================
 * COMPONENT
 * ===================================================================== */

interface BannerSliderProps {
  banners?: Banner[];
}

const controlButton =
  "flex h-11 w-11 items-center justify-center rounded-full border border-white/30 bg-white/15 text-white backdrop-blur-sm transition hover:bg-white hover:text-[#4338ca] focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#312e81]";

const BannerSlider: React.FC<BannerSliderProps> = ({
  banners = defaultBanners,
}) => {
  const count = banners.length;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [hoverPaused, setHoverPaused] = useState(false);
  const [focusPaused, setFocusPaused] = useState(false);
  const [userPaused, setUserPaused] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  const progressBarRef = useRef<HTMLSpanElement>(null);
  const elapsedRef = useRef(0);
  const touchStartX = useRef<number | null>(null);

  /* -------------------------------------------------------------------
   * REDUCED MOTION: stops autoplay and removes animations
   * ------------------------------------------------------------------- */
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    const update = () => setPrefersReducedMotion(mediaQuery.matches);
    update();

    mediaQuery.addEventListener("change", update);
    return () => mediaQuery.removeEventListener("change", update);
  }, []);

  /* -------------------------------------------------------------------
   * PREV / NEXT (wrap around)
   * ------------------------------------------------------------------- */
  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % count);
  }, [count]);

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + count) % count);
  }, [count]);

  /* Keep the index valid if the list gets shorter */
  useEffect(() => {
    if (count > 0 && currentIndex >= count) {
      setCurrentIndex(0);
    }
  }, [count, currentIndex]);

  /* -------------------------------------------------------------------
   * AUTOPLAY
   * Runs only when: more than 1 banner, not hovered, no keyboard focus
   * inside, not paused by the user, and motion is allowed.
   * ------------------------------------------------------------------- */
  const autoplayActive =
    count > 1 &&
    !hoverPaused &&
    !focusPaused &&
    !userPaused &&
    !prefersReducedMotion;

  /* Reset progress every time the slide changes */
  useEffect(() => {
    elapsedRef.current = 0;
    if (progressBarRef.current) {
      progressBarRef.current.style.transform = prefersReducedMotion
        ? "scaleX(1)"
        : "scaleX(0)";
    }
  }, [currentIndex, prefersReducedMotion]);

  /* Timer: keeps elapsed time while paused, so it resumes where it left off */
  useEffect(() => {
    if (!autoplayActive) return;

    let frameId = 0;
    let last = performance.now();

    const tick = (now: number) => {
      elapsedRef.current += now - last;
      last = now;

      const progress = Math.min(elapsedRef.current / AUTOPLAY_MS, 1);

      if (progressBarRef.current) {
        progressBarRef.current.style.transform = `scaleX(${progress})`;
      }

      if (progress >= 1) {
        goToNext();
        return;
      }

      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [autoplayActive, currentIndex, goToNext]);

  /* -------------------------------------------------------------------
   * HIDDEN WHEN THERE ARE NO BANNERS
   * ------------------------------------------------------------------- */
  if (count === 0) {
    return null;
  }

  /* -------------------------------------------------------------------
   * PAUSE ON FOCUS
   * Only keyboard focus pauses (focus-visible), so clicking an arrow with
   * the mouse does not leave the slider stuck in a paused state.
   * ------------------------------------------------------------------- */
  const handleFocus = (event: React.FocusEvent<HTMLElement>) => {
    if (event.target.matches(":focus-visible")) {
      setFocusPaused(true);
    }
  };

  const handleBlur = (event: React.FocusEvent<HTMLElement>) => {
    const next = event.relatedTarget as Node | null;
    if (!event.currentTarget.contains(next)) {
      setFocusPaused(false);
    }
  };

  /* Keyboard: left / right arrow keys */
  const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      goToPrevious();
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      goToNext();
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
    if (deltaX < 0) goToNext();
    else goToPrevious();
  };

  const showControls = count > 1;
  const slideFade = prefersReducedMotion
    ? ""
    : "transition-opacity duration-700 ease-in-out";
  const contentMotion = prefersReducedMotion
    ? ""
    : "transition-all duration-700 ease-out";
  const imageMotion = prefersReducedMotion
    ? ""
    : "transition-transform duration-[6000ms] ease-out";

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <section
      className="bg-white py-10 sm:py-14"
      aria-roledescription="carousel"
      aria-label="HomeCareX promotional banners"
      onMouseEnter={() => setHoverPaused(true)}
      onMouseLeave={() => setHoverPaused(false)}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div
          className="relative overflow-hidden rounded-3xl bg-[#312e81] shadow-xl shadow-indigo-900/20"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* ===================== SLIDES ===================== */}
          <div className="relative min-h-[460px] sm:min-h-[500px] lg:min-h-[540px]">
            {banners.map((banner, index) => {
              const isActive = index === currentIndex;

              return (
                <div
                  key={banner.id}
                  role="group"
                  aria-roledescription="slide"
                  aria-label={`${index + 1} of ${count}`}
                  aria-hidden={!isActive}
                  className={`absolute inset-0 ${slideFade} ${
                    isActive ? "opacity-100" : "pointer-events-none opacity-0"
                  }`}
                >
                  {/* Image: first one loads immediately, the rest are lazy */}
                  <img
                    src={banner.image}
                    alt={isActive ? banner.alt : ""}
                    loading={index === 0 ? "eager" : "lazy"}
                    fetchPriority={index === 0 ? "high" : "auto"}
                    decoding="async"
                    draggable={false}
                    className={`absolute inset-0 h-full w-full object-cover ${imageMotion} ${
                      isActive ? "scale-100" : "scale-105"
                    }`}
                  />

                  {/* Readability overlays */}
                  <div className="absolute inset-0 bg-gradient-to-r from-[#1e1b4b]/95 via-[#312e81]/70 to-[#312e81]/10" />
                  <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#1e1b4b]/80 to-transparent" />

                  {/* Content */}
                  <div className="relative flex h-full items-center px-6 pb-28 pt-12 sm:px-12 lg:px-16">
                    <div
                      className={`max-w-xl text-white ${contentMotion} ${
                        isActive
                          ? "translate-y-0 opacity-100"
                          : "translate-y-3 opacity-0"
                      }`}
                    >
                      <span className="inline-block rounded-full border border-white/25 bg-white/15 px-3.5 py-1 text-sm font-semibold text-white backdrop-blur-sm">
                        {banner.category}
                      </span>

                      <h2 className="mt-5 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
                        {banner.title}
                      </h2>

                      <p className="mt-4 max-w-md text-base leading-7 text-white/90 sm:text-lg">
                        {banner.description}
                      </p>

                      <a
                        href={banner.link}
                        tabIndex={isActive ? 0 : -1}
                        className="group mt-8 inline-flex items-center gap-2 rounded-xl bg-[#ff8a3d] px-6 py-3.5 font-semibold text-white shadow-lg shadow-black/20 transition hover:bg-[#e0600f] focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#312e81]"
                      >
                        Explore services
                        <span className="transition-transform group-hover:translate-x-1">
                          <ArrowRight />
                        </span>
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ===================== CONTROL BAR ===================== */}
          {showControls && (
            <div className="absolute inset-x-0 bottom-0 z-20 flex items-center gap-4 px-6 pb-6 sm:px-12 lg:px-16">
              {/* Progress segments (also act as slide pickers) */}
              <div
                className="flex flex-1 items-center gap-2 sm:max-w-md"
                role="group"
                aria-label="Choose a banner"
              >
                {banners.map((banner, index) => {
                  const isActive = index === currentIndex;

                  return (
                    <button
                      key={banner.id}
                      type="button"
                      onClick={() => setCurrentIndex(index)}
                      aria-label={`Go to banner ${index + 1}: ${banner.category}`}
                      aria-current={isActive ? "true" : undefined}
                      className="group flex h-6 flex-1 items-center focus:outline-none"
                    >
                      <span
                        className={`relative block h-1 w-full overflow-hidden rounded-full bg-white/30 transition group-hover:bg-white/50 group-focus-visible:ring-2 group-focus-visible:ring-white group-focus-visible:ring-offset-2 group-focus-visible:ring-offset-[#312e81] ${
                          isActive ? "h-1.5" : ""
                        }`}
                      >
                        {isActive && (
                          <span
                            ref={progressBarRef}
                            className="absolute inset-0 origin-left rounded-full bg-[#ff8a3d]"
                            style={{
                              transform: prefersReducedMotion
                                ? "scaleX(1)"
                                : "scaleX(0)",
                            }}
                          />
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Counter */}
              <p
                className="hidden text-sm font-semibold tabular-nums text-white/90 sm:block"
                aria-hidden="true"
              >
                {pad(currentIndex + 1)} / {pad(count)}
              </p>

              {/* Buttons */}
              <div className="flex items-center gap-2">
                {!prefersReducedMotion && (
                  <button
                    type="button"
                    onClick={() => setUserPaused((paused) => !paused)}
                    aria-label={
                      userPaused ? "Resume autoplay" : "Pause autoplay"
                    }
                    className={controlButton}
                  >
                    {userPaused ? <PlayIcon /> : <PauseIcon />}
                  </button>
                )}

                <button
                  type="button"
                  onClick={goToPrevious}
                  aria-label="Previous banner"
                  className={controlButton}
                >
                  <ChevronLeft />
                </button>

                <button
                  type="button"
                  onClick={goToNext}
                  aria-label="Next banner"
                  className={controlButton}
                >
                  <ChevronRight />
                </button>
              </div>
            </div>
          )}

          {/* Screen readers hear slide changes only when autoplay is not running */}
          <p className="sr-only" aria-live={autoplayActive ? "off" : "polite"}>
            {`Banner ${currentIndex + 1} of ${count}: ${
              banners[currentIndex].title
            }`}
          </p>
        </div>
      </div>
    </section>
  );
};

export default BannerSlider;