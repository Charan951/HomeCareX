import { useState } from "react";
import { Plus } from "lucide-react";
import clsx from "clsx";
import { FOCUS_RING } from "@/components/customer/focusRing";
import type { ServiceFaq } from "@/types/catalog";

/** FAQs straight from the API (nothing hardcoded). Several can be open; hidden answers leave the tab order. */
export default function FaqAccordion({ faqs }: { faqs: ServiceFaq[] }) {
  const [open, setOpen] = useState<ReadonlySet<string>>(() => new Set());
  if (faqs.length === 0) return null;

  const toggle = (id: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (!next.delete(id)) next.add(id);
      return next;
    });

  return (
    <section id="faqs" aria-labelledby="faq-title" className="scroll-mt-40">
      <h2 id="faq-title" className="text-xl font-bold tracking-tight text-ink md:text-2xl">
        Questions people ask
      </h2>
      <ul className="mt-4 space-y-2.5">
        {faqs.map((f) => {
          const isOpen = open.has(f.id);
          return (
            <li key={f.id} className={clsx("rounded-2xl border bg-panel transition-colors duration-300", isOpen ? "sd-faq-open border-brand/30 shadow-[0_16px_30px_-24px_rgba(67,56,202,.6)]" : "border-line")}>
              <h3>
                <button
                  type="button"
                  id={`faq-q-${f.id}`}
                  aria-expanded={isOpen}
                  aria-controls={`faq-a-${f.id}`}
                  onClick={() => toggle(f.id)}
                  className={clsx("flex min-h-[56px] w-full items-center justify-between gap-4 rounded-2xl px-4 py-3 text-left text-[15px] font-semibold text-ink md:px-5", FOCUS_RING)}
                >
                  <span className="min-w-0">{f.question}</span>
                  <span
                    className={clsx(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all duration-300 motion-reduce:transition-none",
                      isOpen ? "rotate-45 bg-brand text-white" : "bg-brand-soft text-brand",
                    )}
                    aria-hidden="true"
                  >
                    <Plus className="h-4 w-4" strokeWidth={3} />
                  </span>
                </button>
              </h3>
              <div
                id={`faq-a-${f.id}`}
                role="region"
                aria-labelledby={`faq-q-${f.id}`}
                className={clsx("grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none", isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}
              >
                <div className="overflow-hidden">
                  <p className="sd-faq-body px-4 pb-4 text-sm leading-7 text-muted md:px-5">{f.answer}</p>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
