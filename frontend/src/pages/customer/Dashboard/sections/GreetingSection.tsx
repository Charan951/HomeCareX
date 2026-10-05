import type { ReactNode } from "react";
import { greetingForHour } from "@/features/customer";

interface GreetingSectionProps {
  firstName: string;
  isNewCustomer: boolean;
  /** Location + search go inside the same card. */
  children: ReactNode;
}

export default function GreetingSection({ firstName, isNewCustomer, children }: GreetingSectionProps) {
  return (
    <section className="rounded-lg border border-line bg-panel p-4 shadow-sm sm:p-5">
      <h1 className="text-xl font-semibold text-ink">
        {greetingForHour(new Date().getHours())}, {firstName} <span aria-hidden="true">👋</span>
      </h1>
      <p className="mb-4 mt-1 text-sm text-muted">
        {isNewCustomer ? "What can we help you with at home today?" : "What would you like to get done today?"}
      </p>
      {children}
    </section>
  );
}
