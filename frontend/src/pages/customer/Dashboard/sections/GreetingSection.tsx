import type { ReactNode } from "react";
import { Sparkles } from "lucide-react";
import { Icon3D } from "@/components/customer";
import { greetingForHour } from "@/features/customer";

interface GreetingSectionProps {
  firstName: string;
  isNewCustomer: boolean;
  /** Search box (and quick-search chips) go inside the hero. */
  children: ReactNode;
}

/** Indigo hero: greeting, search and a floating 3D house. */
export default function GreetingSection({ firstName, isNewCustomer, children }: GreetingSectionProps) {
  return (
    <section className="relative isolate overflow-hidden rounded-[22px] bg-brand p-5 text-white shadow-[0_18px_42px_rgba(67,56,202,.25)] md:rounded-[28px] md:p-8">
      <span aria-hidden="true" className="hero-orb pointer-events-none absolute -right-14 -top-16 h-52 w-52 rounded-full bg-accent/30 md:h-72 md:w-72" />
      <span aria-hidden="true" className="hero-orb pointer-events-none absolute -bottom-20 left-1/3 h-44 w-44 rounded-full bg-white/10 [animation-delay:-3s]" />
      <Sparkles aria-hidden="true" className="absolute right-[42%] top-6 hidden h-5 w-5 text-white/40 md:block" />

      <div className="pointer-events-none absolute bottom-3 right-6 hidden md:block lg:right-12">
        <Icon3D hints={["🏡"]} size={168} className="opacity-95" />
      </div>

      <div className="relative z-[1] max-w-xl">
        <h1 className="text-2xl font-semibold leading-tight md:text-3xl">
          {greetingForHour(new Date().getHours())}, {firstName}
        </h1>
        <p className="mt-1 text-sm text-white/80 md:text-base">
          {isNewCustomer ? "What can we help you with at home today?" : "What would you like to get done today?"}
        </p>
        {children}
      </div>
    </section>
  );
}
