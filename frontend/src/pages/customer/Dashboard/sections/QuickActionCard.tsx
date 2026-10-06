import { Link } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import clsx from "clsx";
import { FOCUS_RING } from "@/components/customer/focusRing";

export type QuickActionTone = "indigo" | "orange" | "pink" | "green";

/** Glossy "clay" icon discs: gradient + top highlight + bottom inner shade + coloured drop shadow. */
const TONES: Record<QuickActionTone, string> = {
  indigo: "from-[#8B7CF6] to-[#4338CA] shadow-[0_8px_14px_-6px_rgba(67,56,202,.7),inset_0_1px_0_rgba(255,255,255,.5),inset_0_-2px_0_rgba(0,0,0,.14)]",
  orange: "from-[#FFB35C] to-[#F26A0C] shadow-[0_8px_14px_-6px_rgba(242,106,12,.7),inset_0_1px_0_rgba(255,255,255,.5),inset_0_-2px_0_rgba(0,0,0,.14)]",
  pink: "from-[#F58BB7] to-[#D13A7C] shadow-[0_8px_14px_-6px_rgba(209,58,124,.65),inset_0_1px_0_rgba(255,255,255,.5),inset_0_-2px_0_rgba(0,0,0,.14)]",
  green: "from-[#4FD1A5] to-[#12805F] shadow-[0_8px_14px_-6px_rgba(18,128,95,.65),inset_0_1px_0_rgba(255,255,255,.5),inset_0_-2px_0_rgba(0,0,0,.14)]",
};

interface QuickActionCardProps {
  label: string;
  to: string;
  icon: LucideIcon;
  tone: QuickActionTone;
  disabled?: boolean;
}

/** One round glossy icon with its label underneath (a cell of the QuickActions row). */
export default function QuickActionCard({ label, to, icon: Icon, tone, disabled = false }: QuickActionCardProps) {
  const disc = (
    <span
      aria-hidden="true"
      className={clsx(
        "flex h-[46px] w-[46px] items-center justify-center rounded-full bg-gradient-to-br text-white transition-transform duration-200",
        TONES[tone],
        disabled ? "opacity-40 grayscale" : "group-hover:scale-105 group-active:scale-90",
      )}
    >
      <Icon className="h-[22px] w-[22px] drop-shadow-[0_1px_1px_rgba(0,0,0,.25)]" aria-hidden="true" />
    </span>
  );
  const text = "max-w-[5rem] text-center text-[11px] font-semibold leading-tight";

  if (disabled) {
    return (
      <span aria-disabled="true" title={`${label} isn't available yet`} className="flex flex-col items-center gap-2 px-1 py-1">
        {disc}
        <span className={clsx(text, "text-muted")}>{label}</span>
      </span>
    );
  }
  return (
    <Link to={to} className={clsx("group flex flex-col items-center gap-2 rounded-2xl px-1 py-1", FOCUS_RING)}>
      {disc}
      <span className={clsx(text, "text-ink")}>{label}</span>
    </Link>
  );
}
