import { useEffect, useMemo, useRef, useState } from "react";
import type { LedgerDay } from "@/types/earnings";
import { addDays, compactInr, inr, shortDate } from "./earningsFormat";

interface Bar {
  label: string;
  title: string;
  value: number;
}

const MAX_DAILY_BARS = 62;

/** Daily bars up to ~2 months; longer ranges are summed per 7 days so bars stay readable. */
function toBars(series: LedgerDay[]): { bars: Bar[]; unit: "day" | "week" } {
  if (series.length <= MAX_DAILY_BARS) {
    return {
      unit: "day",
      bars: series.map((d) => ({ label: shortDate(d.date), title: shortDate(d.date, true), value: d.net })),
    };
  }
  const bars: Bar[] = [];
  for (let i = 0; i < series.length; i += 7) {
    const chunk = series.slice(i, i + 7);
    const end = addDays(chunk[0].date, chunk.length - 1);
    bars.push({
      label: shortDate(chunk[0].date),
      title: `${shortDate(chunk[0].date)} to ${shortDate(end, true)}`,
      value: chunk.reduce((sum, d) => sum + d.net, 0),
    });
  }
  return { bars, unit: "week" };
}

/** Rounds the top of the scale up to 1, 2, 2.5, 5 or 10 x a power of ten so gridline labels are tidy. */
function niceMax(max: number): number {
  if (max <= 0) return 100;
  const pow = Math.pow(10, Math.floor(Math.log10(max)));
  const step = [1, 2, 2.5, 5, 10].find((m) => max <= m * pow) ?? 10;
  return step * pow;
}

const H = 140;
const M = { top: 8, right: 6, bottom: 20, left: 38 };

/** Width of the chart box, so the chart keeps a fixed short height at any screen size. */
function useBoxWidth() {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(640);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setWidth(Math.max(260, Math.round(el.clientWidth)));
    update();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
}

export default function EarningsChart({ series }: { series: LedgerDay[] }) {
  const { bars, unit } = useMemo(() => toBars(series), [series]);
  const total = bars.reduce((sum, b) => sum + b.value, 0);
  const [boxRef, W] = useBoxWidth();

  if (bars.length === 0 || total === 0) {
    return (
      <div ref={boxRef}>
        <p className="earn-chart-empty">No earnings in this period yet.</p>
      </div>
    );
  }

  const top = niceMax(Math.max(...bars.map((b) => b.value)));
  const innerW = W - M.left - M.right;
  const innerH = H - M.top - M.bottom;
  const slot = innerW / bars.length;
  const barW = Math.max(2, Math.min(30, slot * 0.7));
  const y = (v: number) => M.top + innerH - (v / top) * innerH;
  const labelEvery = Math.max(1, Math.ceil(bars.length / 6));
  const ticks = [0, 0.5, 1].map((f) => f * top);

  return (
    <div ref={boxRef}>
    <svg
      className="earn-chart"
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={`Net earnings per ${unit}, ${bars.length} ${unit}s, ${inr(total)} in total. The table below lists every earning.`}
    >
      {ticks.map((t) => (
        <g key={t}>
          <line className="earn-chart-grid" x1={M.left} x2={W - M.right} y1={y(t)} y2={y(t)} />
          <text className="earn-chart-axis" x={M.left - 6} y={y(t) + 3} textAnchor="end">
            {compactInr(t)}
          </text>
        </g>
      ))}

      {bars.map((b, i) => {
        const x = M.left + slot * i + (slot - barW) / 2;
        const h = Math.max(b.value > 0 ? 2 : 0, innerH - (y(b.value) - M.top));
        return (
          <g key={i}>
            <rect className="earn-bar" x={x} y={M.top + innerH - h} width={barW} height={h} rx={Math.min(3, barW / 2)}>
              <title>{`${b.title}: ${inr(b.value)}`}</title>
            </rect>
            {i % labelEvery === 0 && (
              <text className="earn-chart-axis" x={x + barW / 2} y={H - 6} textAnchor="middle">
                {b.label}
              </text>
            )}
          </g>
        );
      })}
    </svg>
    </div>
  );
}