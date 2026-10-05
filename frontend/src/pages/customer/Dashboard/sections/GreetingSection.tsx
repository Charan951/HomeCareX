import type { CSSProperties } from "react";
import { greetingForHour } from "@/features/customer";

interface GreetingSectionProps {
  firstName: string;
  isNewCustomer: boolean;
}

const step = (i: number) => ({ "--i": i }) as CSSProperties;

/** Greeting and name only. The category banner and search box now sit below it (see HeroBanner). Entrance motion is in index.css (.hero-rise, reduced-motion safe). */
export default function GreetingSection({ firstName, isNewCustomer }: GreetingSectionProps) {
  return (
    <section aria-labelledby="dashboard-greeting" className="px-1 text-ink md:px-2">
      <div className="hero-rise" style={step(0)}>
        <span className="inline-flex items-center gap-2 rounded-full border border-[#D9DCF7] bg-white py-1 pl-2.5 pr-3.5 text-xs font-semibold text-ink">
          <span aria-hidden="true" className="hero-live-dot relative h-2 w-2 rounded-full bg-emerald-500 text-emerald-500" />
          {greetingForHour(new Date().getHours())}
        </span>
      </div>
      <h1 id="dashboard-greeting" className="hero-rise mt-3 max-w-3xl text-[27px] font-bold leading-[1.15] tracking-tight md:text-[40px]" style={step(1)}>
        Welcome, {firstName}
      </h1>
      <p className="hero-rise mt-2 text-sm text-muted md:text-[15px]" style={step(2)}>
        Trusted professionals at your door. Transparent prices, no surprises.
      </p>
    </section>
  );
}
