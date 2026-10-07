import { X } from "lucide-react";
import clsx from "clsx";
import { useInView } from "@/hooks/useInView";
import { cssVars } from "../format";

function CheckBadge({ i }: { i: number }) {
  return (
    <span className="sd-check-badge mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#D3F0DF] text-[#15803D]" style={cssVars({ "--i": i })} aria-hidden="true">
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <path className="sd-check-path" style={cssVars({ "--i": i })} d="M5 12.5l4.5 4.5L19 7.5" />
      </svg>
    </span>
  );
}

/** "Included" (ticks draw in as the card scrolls into view) next to "Not included". Either side can be empty. */
export default function InclusionList({ inclusions, exclusions }: { inclusions: string[]; exclusions: string[] }) {
  const [ref, seen] = useInView<HTMLDivElement>(0.2);
  if (inclusions.length === 0 && exclusions.length === 0) return null;
  const both = inclusions.length > 0 && exclusions.length > 0;

  return (
    <section id="included" aria-labelledby="included-title" className="scroll-mt-40">
      <h2 id="included-title" className="text-xl font-bold tracking-tight text-ink md:text-2xl">
        What&apos;s included
      </h2>
      <div ref={ref} className={clsx("mt-4 grid gap-4", both && "md:grid-cols-2", seen && "sd-in")}>
        {inclusions.length > 0 && (
          <div className="rounded-3xl border border-[#BBE5CB] bg-[#F1FAF5] p-5">
            <h3 className="text-base font-semibold text-[#14532D]">You get</h3>
            <ul className="mt-3 space-y-3">
              {inclusions.map((text, i) => (
                <li key={`${i}-${text}`} className="flex items-start gap-3 text-sm leading-6 text-ink">
                  <CheckBadge i={i} />
                  <span className="min-w-0">{text}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {exclusions.length > 0 && (
          <div className="rounded-3xl border border-line bg-panel p-5">
            <h3 className="text-base font-semibold text-ink">Not covered</h3>
            <ul className="mt-3 space-y-3">
              {exclusions.map((text, i) => (
                <li key={`${i}-${text}`} className="flex items-start gap-3 text-sm leading-6 text-muted">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-line/70 text-muted" aria-hidden="true">
                    <X className="h-3.5 w-3.5" strokeWidth={3} />
                  </span>
                  <span className="min-w-0">{text}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}
