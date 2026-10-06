import { Link } from "react-router-dom";
import { Pencil } from "lucide-react";
import clsx from "clsx";
import { customerPath } from "@/routes/customerPath";
import { FOCUS_RING } from "@/components/customer/focusRing";

export interface ProfileStat {
  label: string;
  /** undefined = still loading, null = couldn't load */
  value: number | null | undefined;
  to: string;
}

interface ProfileHeroProps {
  name: string;
  email?: string;
  phone?: string;
  stats: ProfileStat[];
}

export const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "?";

/**
 * Mobile profile header: flat lavender card, animated avatar ring, contact line and three live,
 * tappable stats (active / upcoming bookings, saved addresses) taken from the real API data.
 */
export default function ProfileHero({ name, email, phone, stats }: ProfileHeroProps) {
  const contact = [email, phone].filter(Boolean);
  return (
    <section
      aria-labelledby="profile-name"
      className="profile-rise relative overflow-hidden rounded-[28px] border border-[#D9DCF7] bg-[#E9EBFF] p-5 text-ink md:hidden"
    >
      <div className="relative flex items-center gap-4">
        <span className="profile-avatar-ring relative flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-full" aria-hidden="true">
          <span className="relative z-[1] flex h-[66px] w-[66px] items-center justify-center rounded-full border-[3px] border-white bg-brand text-2xl font-bold text-white">
            {initialsOf(name)}
          </span>
        </span>
        <div className="min-w-0">
          <h1 id="profile-name" className="truncate text-xl font-bold leading-tight">
            {name}
          </h1>
          {contact.length > 0 ? (
            contact.map((c) => (
              <p key={c} className="truncate text-[13px] leading-snug text-muted">
                {c}
              </p>
            ))
          ) : (
            <p className="text-[13px] text-muted">HomeCareX customer</p>
          )}
          <Link
            to={customerPath("/profile/edit")}
            className={clsx(
              "group mt-2 inline-flex min-h-9 items-center gap-1.5 rounded-full border-[1.5px] border-[#B9BFF2] bg-[#E9EBFF] py-1 pl-3 pr-3.5 text-[13px] font-semibold text-brand transition-all duration-200 hover:bg-white motion-safe:active:scale-95",
              FOCUS_RING,
            )}
          >
            <Pencil className="h-3.5 w-3.5 transition-transform duration-200 group-hover:-rotate-12" aria-hidden="true" />
            <span className="bg-[linear-gradient(currentColor,currentColor)] bg-[length:0%_1.5px] bg-left-bottom bg-no-repeat pb-px transition-[background-size] duration-300 group-hover:bg-[length:100%_1.5px]">
              Edit profile
            </span>
          </Link>
        </div>
      </div>

      <ul className="relative mt-5 grid grid-cols-3 gap-2.5">
        {stats.map((s) => (
          <li key={s.label}>
            <Link
              to={s.to}
              className={clsx(
                "group flex min-h-[64px] flex-col items-center justify-center rounded-2xl border border-[#D9DCF7] bg-white px-2 py-2 text-center transition-all duration-200 hover:border-brand motion-safe:active:scale-95",
                FOCUS_RING,
              )}
            >
              {s.value === undefined ? (
                <span className="h-6 w-8 animate-pulse rounded-md bg-line" role="status" aria-label={`Loading ${s.label}`} />
              ) : (
                <span className="profile-pop text-xl font-bold leading-none">{s.value ?? "–"}</span>
              )}
              <span className="mt-1.5 text-[11px] font-medium leading-none text-muted">{s.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export const statLinks = {
  active: customerPath("/tracking"),
  upcoming: customerPath("/bookings"),
  places: customerPath("/addresses"),
};
