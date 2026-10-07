import { useCallback, useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, ImageOff, Maximize2, X } from "lucide-react";
import clsx from "clsx";
import { FOCUS_RING } from "@/components/customer/focusRing";
import { NO_SCROLLBAR } from "@/components/customer/noScrollbar";
import { useOverlay } from "@/hooks/useOverlay";
import type { ServiceMedia } from "@/types/catalog";
import { prefersReducedMotion } from "../format";

/**
 * Swipe handling shared by the page gallery and the fullscreen view. Horizontal drags move the
 * slides under the finger (vertical drags still scroll the page: the track sets touch-action: pan-y),
 * and a fast flick or a drag past ~18% of the width changes slide. A drag never counts as a click.
 */
function useCarousel(index: number, count: number, onIndex: (i: number) => void) {
  const [drag, setDrag] = useState(0);
  const [dragging, setDragging] = useState(false);
  const start = useRef<{ x: number; y: number; t: number; w: number } | null>(null);
  const moved = useRef(false);

  const reset = () => {
    start.current = null;
    setDrag(0);
    setDragging(false);
  };

  const bind = {
    onPointerDown: (e: ReactPointerEvent<HTMLElement>) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      start.current = { x: e.clientX, y: e.clientY, t: performance.now(), w: e.currentTarget.clientWidth };
      moved.current = false;
    },
    onPointerMove: (e: ReactPointerEvent<HTMLElement>) => {
      const s = start.current;
      if (!s || count < 2) return;
      let dx = e.clientX - s.x;
      if (!dragging) {
        if (Math.abs(dx) < 8 || Math.abs(dx) < Math.abs(e.clientY - s.y)) return;
        setDragging(true);
        e.currentTarget.setPointerCapture(e.pointerId);
      }
      // Rubber-band at the first and last slide.
      if ((index === 0 && dx > 0) || (index === count - 1 && dx < 0)) dx *= 0.35;
      moved.current = true;
      setDrag(dx);
    },
    onPointerUp: (e: ReactPointerEvent<HTMLElement>) => {
      const s = start.current;
      if (dragging && s) {
        const dx = e.clientX - s.x;
        const velocity = dx / Math.max(1, performance.now() - s.t);
        if (Math.abs(dx) > s.w * 0.18 || Math.abs(velocity) > 0.5) onIndex(Math.min(count - 1, Math.max(0, index + (dx < 0 ? 1 : -1))));
      }
      reset();
    },
    onPointerCancel: reset,
  };

  /** True (once) when the click that follows a drag should be ignored. */
  const consumeClick = () => {
    const was = moved.current;
    moved.current = false;
    return was;
  };

  return { drag, dragging, bind, consumeClick };
}

interface SlidesProps {
  items: ServiceMedia[];
  index: number;
  drag: number;
  dragging: boolean;
  fit: "cover" | "contain";
  failed: ReadonlySet<number>;
  onFail: (i: number) => void;
  /** Slow zoom on the first photo as the page opens. */
  ken?: boolean;
}

function Slides({ items, index, drag, dragging, fit, failed, onFail, ken }: SlidesProps) {
  const ms = prefersReducedMotion() ? 0 : 450;
  return (
    <div
      className="flex h-full w-full"
      style={{
        transform: `translate3d(calc(${-index * 100}% + ${drag}px), 0, 0)`,
        transition: dragging ? "none" : `transform ${ms}ms cubic-bezier(.22,1,.36,1)`,
      }}
    >
      {items.map((m, i) => (
        <div key={`${m.url}-${i}`} className="relative h-full w-full shrink-0 basis-full" aria-hidden={i !== index}>
          {failed.has(i) ? (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-brand-soft text-muted">
              <ImageOff className="h-8 w-8" aria-hidden="true" />
              <span className="text-sm">Photo unavailable</span>
            </div>
          ) : (
            <img
              src={m.url}
              alt={m.alt}
              loading={i === 0 ? "eager" : "lazy"}
              decoding="async"
              draggable={false}
              onError={() => onFail(i)}
              className={clsx("h-full w-full select-none", fit === "cover" ? "object-cover object-[50%_22%]" : "object-contain", ken && i === 0 && "sd-ken")}
            />
          )}
        </div>
      ))}
    </div>
  );
}

/** 4:3 on phones; from tablet up the frame also never grows taller than the screen (minus header, breadcrumb and thumbnails). */
const FRAME = "w-full aspect-[16/11] md:aspect-[16/9] xl:aspect-[9/5] md:max-h-[calc(100svh-17.5rem)] md:min-h-[260px]";

const ARROW = clsx(
  "absolute top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink shadow-md backdrop-blur",
  "transition-[opacity,transform,background-color] duration-200 hover:bg-white disabled:pointer-events-none disabled:opacity-0 motion-safe:active:scale-95",
  FOCUS_RING,
);

interface LightboxProps {
  name: string;
  items: ServiceMedia[];
  index: number;
  onIndex: (i: number) => void;
  onClose: () => void;
  failed: ReadonlySet<number>;
  onFail: (i: number) => void;
}

/** Fullscreen photo viewer: Esc closes, arrow keys and swipe move, focus is trapped and restored. */
function Lightbox({ name, items, index, onIndex, onClose, failed, onFail }: LightboxProps) {
  const panelRef = useOverlay<HTMLDivElement>(true, onClose);
  const car = useCarousel(index, items.length, onIndex);
  const last = items.length - 1;

  const onKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowRight") onIndex(Math.min(last, index + 1));
    if (e.key === "ArrowLeft") onIndex(Math.max(0, index - 1));
  };

  return createPortal(
    <div
      ref={panelRef}
      role="dialog"
      aria-modal="true"
      aria-label={`${name} photos`}
      tabIndex={-1}
      onKeyDown={onKeyDown}
      className="sd-lightbox fixed inset-0 z-[80] flex flex-col bg-[#0E0C1B]/95 outline-none backdrop-blur-md"
    >
      <div className="flex items-center justify-between gap-3 px-4 py-3 text-white md:px-6">
        <p className="min-w-0 truncate text-sm font-semibold">{name}</p>
        <div className="flex items-center gap-3">
          <span className="text-sm tabular-nums text-white/70" aria-live="polite">
            {index + 1} / {items.length}
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close fullscreen photos"
            className={clsx("flex h-11 w-11 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20", FOCUS_RING, "focus-visible:ring-offset-[#0E0C1B]")}
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="sd-lightbox-stage relative min-h-0 flex-1">
        <div className="h-full w-full overflow-hidden" style={{ touchAction: "pan-y" }} {...car.bind}>
          <Slides items={items} index={index} drag={car.drag} dragging={car.dragging} fit="contain" failed={failed} onFail={onFail} />
        </div>
        {items.length > 1 && (
          <>
            <button type="button" onClick={() => onIndex(index - 1)} disabled={index === 0} aria-label="Previous photo" className={clsx(ARROW, "left-3 md:left-6")}>
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </button>
            <button type="button" onClick={() => onIndex(index + 1)} disabled={index === last} aria-label="Next photo" className={clsx(ARROW, "right-3 md:right-6")}>
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </button>
          </>
        )}
      </div>

      {items.length > 1 && (
        <ul className={clsx("flex justify-center gap-2 overflow-x-auto px-4 py-4", NO_SCROLLBAR)}>
          {items.map((m, i) => (
            <li key={`${m.url}-${i}`} className="shrink-0">
              <button
                type="button"
                onClick={() => onIndex(i)}
                aria-label={`Show photo ${i + 1}`}
                aria-current={i === index}
                className={clsx(
                  "h-12 w-16 overflow-hidden rounded-lg ring-2 transition-opacity",
                  i === index ? "opacity-100 ring-white" : "opacity-50 ring-transparent hover:opacity-90",
                  FOCUS_RING,
                  "focus-visible:ring-offset-[#0E0C1B]",
                )}
              >
                {failed.has(i) ? <span className="block h-full w-full bg-white/10" /> : <img src={m.url} alt="" draggable={false} className="h-full w-full object-cover" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>,
    document.body,
  );
}

interface GalleryProps {
  name: string;
  items: ServiceMedia[];
  /** Shown when the service has no photos at all. */
  placeholder: ReactNode;
}

/** Main photo + thumbnails, swipe on touch screens, keyboard arrows, and a fullscreen view. */
export default function Gallery({ name, items, placeholder }: GalleryProps) {
  const count = items.length;
  const [index, setIndex] = useState(0);
  const [open, setOpen] = useState(false);
  const [failed, setFailed] = useState<ReadonlySet<number>>(() => new Set());
  const thumbs = useRef<(HTMLButtonElement | null)[]>([]);
  const firstRender = useRef(true);

  const go = useCallback((i: number) => setIndex(Math.min(count - 1, Math.max(0, i))), [count]);
  const onFail = useCallback((i: number) => setFailed((prev) => new Set(prev).add(i)), []);
  const car = useCarousel(index, count, go);

  // Keep the active thumbnail in view (skipped on first render so the page doesn't jump).
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    thumbs.current[index]?.scrollIntoView({ block: "nearest", inline: "center", behavior: prefersReducedMotion() ? "auto" : "smooth" });
  }, [index]);

  const onKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowRight") go(index + 1);
    if (e.key === "ArrowLeft") go(index - 1);
  };

  if (count === 0) {
    return <div className={clsx("sd-gallery-reveal relative overflow-hidden rounded-[28px]", FRAME)}>{placeholder}</div>;
  }

  return (
    <div>
      <div
        role="group"
        aria-roledescription="carousel"
        aria-label={`${name} photos`}
        tabIndex={0}
        onKeyDown={onKeyDown}
        className={clsx("sd-gallery-reveal group relative overflow-hidden rounded-[28px] bg-brand-soft", FRAME, FOCUS_RING)}
      >
        <div
          className="h-full w-full cursor-zoom-in"
          style={{ touchAction: "pan-y" }}
          onClick={() => {
            if (!car.consumeClick()) setOpen(true);
          }}
          {...car.bind}
        >
          <Slides items={items} index={index} drag={car.drag} dragging={car.dragging} fit="cover" failed={failed} onFail={onFail} ken />
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/35 to-transparent" aria-hidden="true" />

        {count > 1 && (
          <span className="pointer-events-none absolute bottom-3.5 left-3.5 rounded-full bg-black/45 px-3 py-1 text-xs font-semibold tabular-nums text-white backdrop-blur" aria-live="polite">
            {index + 1} / {count}
          </span>
        )}

        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          aria-label="View photos fullscreen"
          className={clsx(
            "absolute right-3 top-3 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-ink shadow-md backdrop-blur transition-transform hover:bg-white motion-safe:active:scale-95",
            FOCUS_RING,
          )}
        >
          <Maximize2 className="h-[18px] w-[18px]" aria-hidden="true" />
        </button>

        {count > 1 && (
          <>
            <button type="button" onClick={() => go(index - 1)} disabled={index === 0} aria-label="Previous photo" className={clsx(ARROW, "left-3")}>
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </button>
            <button type="button" onClick={() => go(index + 1)} disabled={index === count - 1} aria-label="Next photo" className={clsx(ARROW, "right-3")}>
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </button>
          </>
        )}
      </div>

      {count > 1 && (
        <ul className={clsx("mt-2.5 flex gap-2.5 overflow-x-auto p-1.5", NO_SCROLLBAR)}>
          {items.map((m, i) => (
            <li key={`${m.url}-${i}`} className="shrink-0">
              <button
                ref={(el) => {
                  thumbs.current[i] = el;
                }}
                type="button"
                onClick={() => go(i)}
                aria-label={`Show photo ${i + 1}`}
                aria-current={i === index}
                className={clsx(
                  "block h-14 w-[72px] overflow-hidden rounded-xl ring-2 ring-offset-2 ring-offset-canvas transition-[opacity,box-shadow] duration-200 md:h-16 md:w-24",
                  i === index ? "opacity-100 ring-brand" : "opacity-60 ring-transparent hover:opacity-100",
                  FOCUS_RING,
                )}
              >
                {failed.has(i) ? <span className="block h-full w-full bg-brand-soft" /> : <img src={m.url} alt="" loading="lazy" draggable={false} className="h-full w-full object-cover" />}
              </button>
            </li>
          ))}
        </ul>
      )}

      {open && <Lightbox name={name} items={items} index={index} onIndex={go} onClose={() => setOpen(false)} failed={failed} onFail={onFail} />}
    </div>
  );
}
