import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import clsx from "clsx";
import { customerPath } from "@/routes/customerPath";
import { FOCUS_RING } from "@/components/customer/focusRing";
import { Icon3D, tintAt } from "@/components/customer";
import type { DashboardCategoryDto } from "@/features/customer";
import { categoryPhoto } from "./dashboardImages";

const AUTO_MS = 5500;
const MAX_SLIDES = 6;

/** Wide-banner crops. The card crops in dashboardImages.ts are tuned for tall tiles, so the banner has its own focal points. */
const BANNER_POSITION: Record<string, string> = {
  "salon-spa": "50% 45%",
  "pest-control": "50% 12%",
  "home-cleaning": "50% 55%",
  "appliance-repair": "50% 50%",
  "electrical-plumbing": "50% 40%",
  painting: "50% 40%",
};

/** Banner-only crops of portrait photos (originals stay untouched for the cards). */
const BANNER_IMAGE: Record<string, string> = {
  "salon-spa": `${import.meta.env.BASE_URL}images/Home-spa-women-banner.jpg`,
};

interface HeroBannerProps {
  categories: DashboardCategoryDto[];
  /** Search box (and chips) render just under the banner (overlapping its bottom edge on md+). */
  children?: ReactNode;
}

/**
 * Category hero: slides sit side by side in a track and glide one after the other.
 * Phones: photo on top, category name in a transparent strip below it (nothing sits on the image).
 * md+: text on a dark panel at the left; the photo fills the right and fades into the panel,
 * so any photo shape (wide, tall, low-res) stays framed. Auto-advances, swipeable,
 * pauses for keyboard focus, and does not move for reduced-motion users.
 */
export default function HeroBanner({ categories, children }: HeroBannerProps) {
  const slides = categories.slice(0, MAX_SLIDES);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchX = useRef<number | null>(null);
  const count = slides.length;

  const go = useCallback((i: number) => setActive(((i % count) + count) % count), [count]);

  useEffect(() => {
    if (count < 2 || paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => setActive((a) => (a + 1) % count), AUTO_MS);
    return () => window.clearInterval(id);
  }, [count, paused, active]); // `active` restarts the timer after a manual change

  if (count === 0) return null;

  return (
<section aria-label="Browse by category" className="mx-auto w-full md:max-w-[1130px]">
          <div
        role="group"
        aria-roledescription="carousel"
        onFocus={(e) => setPaused(e.target.matches(":focus-visible"))} // keyboard users only; a mouse click on an arrow must not stop autoplay
        onBlur={() => setPaused(false)}
        onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touchX.current === null) return;
          const dx = e.changedTouches[0].clientX - touchX.current;
          if (Math.abs(dx) > 40) go(active + (dx < 0 ? 1 : -1));
          touchX.current = null;
        }}
        className="relative h-[250px] overflow-hidden rounded-[26px] bg-transparent md:h-[400px] md:rounded-[32px] md:bg-[#1E1B2E] md:shadow-[0_14px_34px_-18px_rgba(30,27,46,.55)]"
      >
        <div
          className="flex h-full transition-transform duration-700 ease-[cubic-bezier(.65,0,.25,1)] motion-reduce:transition-none"
          style={{ transform: `translateX(-${active * 100}%)` }}
        >
          {slides.map((c, i) => (
            <Slide key={c.id} category={c} index={i} isActive={i === active} />
          ))}
        </div>

        {count > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(active - 1)}
              aria-label="Previous category"
              className={clsx("absolute left-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/25 text-white backdrop-blur transition-colors hover:bg-white/45 md:flex", FOCUS_RING)}
            >
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => go(active + 1)}
              aria-label="Next category"
              className={clsx("absolute right-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/25 text-white backdrop-blur transition-colors hover:bg-white/45 md:flex", FOCUS_RING)}
            >
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </button>
            {/* Phones: dots sit on the bottom-right of the photo (above the 70px text strip). */}
            <div className="absolute bottom-[82px] right-4 z-[2] flex gap-1.5 md:bottom-12 md:right-8">
              {slides.map((c, i) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => go(i)}
                  aria-label={`Show ${c.name}`}
                  aria-current={i === active}
                  className={clsx("h-2 rounded-full transition-all duration-300", i === active ? "w-8 bg-white" : "w-2 bg-white/55 hover:bg-white/80")}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Phones: search sits below the banner. md+: pulled up over the banner edge. */}
      <div className="relative z-10 mt-4 px-3 md:-mt-[56px]">{children}</div>
    </section>
  );
}

function Slide({ category: c, index, isActive }: { category: DashboardCategoryDto; index: number; isActive: boolean }) {
  const photo = categoryPhoto(c.slug);
  const [failed, setFailed] = useState(false);
  const showPhoto = photo && !failed;
  const count = `${c.serviceCount} ${c.serviceCount === 1 ? "service" : "services"}`;

  return (
    <div
      aria-hidden={!isActive}
      aria-roledescription="slide"
      className={clsx("relative flex h-full w-full shrink-0 flex-col overflow-hidden md:block", !showPhoto && tintAt(index))}
    >
      {showPhoto ? (
        // Phones: photo is the top 180px. md+: photo takes the right ~68% and fades into the dark panel.
        <div className="relative h-[180px] shrink-0 overflow-hidden rounded-[26px] shadow-[0_14px_34px_-18px_rgba(30,27,46,.55)] md:absolute md:inset-0 md:left-auto md:h-auto md:w-[68%] md:rounded-none md:shadow-none md:[mask-image:linear-gradient(to_right,transparent,#000_28%)]">
          <img
            src={BANNER_IMAGE[c.slug] ?? photo.src}
            alt=""
            loading={index === 0 ? "eager" : "lazy"}
            decoding="async"
            draggable={false}
            onError={() => setFailed(true)}
            style={{ objectPosition: BANNER_POSITION[c.slug] ?? photo.position }}
            className="h-full w-full object-cover"
          />
        </div>
      ) : (
        <Icon3D hints={[c.icon, c.name, c.slug]} size={180} className="absolute bottom-6 right-10" />
      )}
      {/* Desktop-only soft shade; on phones the text is below the photo, so nothing needs a fade. */}
      {showPhoto && <span aria-hidden="true" className="absolute inset-0 hidden bg-gradient-to-r from-[rgba(20,18,36,.35)] via-transparent to-transparent md:block" />}

      {/* Phones: its own strip under the photo. md+: vertically centred at the left. */}
      <div className="relative flex flex-1 items-center gap-1.5 bg-transparent px-1 md:absolute md:inset-y-0 md:left-0 md:max-w-[44%] md:flex-col md:items-start md:justify-center md:gap-2 md:px-14">
        <h2 className={clsx("text-[22px] font-bold leading-[1.1] tracking-tight md:text-[44px]", showPhoto ? "text-ink md:text-white" : "text-ink")}>{c.name}</h2>
       
      </div>
    </div>
  );
}
