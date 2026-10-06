import { Link } from "react-router-dom";
import { ChevronRight, CreditCard, Gift, Headset, Mail, MapPin, Pencil, Phone, Wallet, type LucideIcon } from "lucide-react";
import clsx from "clsx";
import { customerPath } from "@/routes/customerPath";
import { FOCUS_RING } from "@/components/customer/focusRing";
import { initialsOf, type ProfileStat } from "./ProfileHero";

interface Props {
  name: string;
  email?: string;
  phone?: string;
  /** Default address as one line, if the customer has one. */
  addressLabel?: string;
  addressText?: string;
  addressLoading: boolean;
  stats: ProfileStat[];
}

const DISC = "shadow-[0_8px_14px_-6px_var(--sh),inset_0_1px_0_rgba(255,255,255,.5),inset_0_-2px_0_rgba(0,0,0,.14)]";
const SHORTCUTS: { label: string; to: string; icon: LucideIcon; tone: string }[] = [
  { label: "Payments", to: "/payments", icon: CreditCard, tone: "from-[#FFB35C] to-[#F26A0C] [--sh:rgba(242,106,12,.7)]" },
  { label: "Wallet", to: "/wallet", icon: Wallet, tone: "from-[#4FD1A5] to-[#12805F] [--sh:rgba(18,128,95,.65)]" },
  { label: "Refer & earn", to: "/referrals", icon: Gift, tone: "from-[#F58BB7] to-[#D13A7C] [--sh:rgba(209,58,124,.65)]" },
  { label: "Support", to: "/support", icon: Headset, tone: "from-[#6FB6FF] to-[#1D5FD1] [--sh:rgba(29,95,209,.65)]" },
];

function Card({ title, action, children, className }: { title: string; action?: { label: string; to: string }; children: React.ReactNode; className?: string }) {
  return (
    <section className={clsx("rounded-[24px] border border-line bg-panel p-5 lg:p-6", className)}>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[17px] font-bold text-ink">{title}</h2>
        {action && (
          <Link to={action.to} className={clsx("rounded text-[13px] font-semibold text-brand hover:underline", FOCUS_RING)}>
            {action.label}
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

function Field({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value?: string }) {
  return (
    <div className="flex items-center gap-3 border-b border-dashed border-line py-3 last:border-0">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[13px] bg-brand-soft text-brand" aria-hidden="true">
        <Icon className="h-[18px] w-[18px]" />
      </span>
      <div className="min-w-0">
        <div className="text-xs text-muted">{label}</div>
        <div className="truncate text-sm text-ink">{value || "Not added"}</div>
      </div>
    </div>
  );
}

/** Desktop profile: hero header with live stats, then Contact, Default address and Shortcuts cards. */
export default function ProfileDesktop({ name, email, phone, addressLabel, addressText, addressLoading, stats }: Props) {
  const editTo = customerPath("/profile/edit");
  return (
    <div className="hidden space-y-5 md:block">
      <div>
        <h1 className="text-[28px] font-bold leading-tight tracking-tight text-ink">Profile</h1>
        <p className="mt-0.5 text-sm text-muted">Manage your details, places and account shortcuts.</p>
      </div>

      <section aria-labelledby="profile-desktop-name" className="relative flex flex-wrap items-center gap-x-6 gap-y-5 overflow-hidden rounded-[28px] border border-[#D9DCF7] bg-[#E9EBFF] p-5 text-ink lg:p-7">
        <div
          aria-hidden="true"
          className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-4 lg:h-24 lg:w-24 border-white bg-brand text-3xl font-semibold text-white"
        >
          {initialsOf(name)}
        </div>
        <div className="relative min-w-0 flex-1 basis-[200px]">
          <h2 id="profile-desktop-name" className="truncate text-2xl font-bold">
            {name}
          </h2>
          <p className="truncate text-sm text-muted">{email ?? "HomeCareX customer"}</p>
          {addressText && (
            <span className="mt-2 inline-flex max-w-full items-center gap-1.5 rounded-full border border-[#D9DCF7] bg-white px-3 py-0.5 text-xs font-semibold text-ink">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-brand" aria-hidden="true" />
              <span className="truncate">{addressText}</span>
            </span>
          )}
          <Link
            to={editTo}
            className={clsx("mt-3 flex w-fit items-center gap-2 rounded-full border-[1.5px] border-[#B9BFF2] bg-[#E9EBFF] px-5 py-2 text-sm font-semibold text-brand transition-colors hover:bg-white", FOCUS_RING)}
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
            Edit profile
          </Link>
        </div>
        {/* Tablet (sidebar open) is narrow, so the stats drop to their own full-width row; they sit beside the name from xl. */}
        <ul className="relative grid w-full grid-cols-3 gap-3 xl:ml-auto xl:flex xl:w-auto">
          {stats.map((s) => (
            <li key={s.label}>
              <Link
                to={s.to}
                className={clsx("block rounded-[18px] border border-[#D9DCF7] bg-white px-3 py-3 text-center xl:min-w-[96px] xl:px-5 transition-colors hover:border-brand", FOCUS_RING)}
              >
                {s.value === undefined ? (
                  <span className="mx-auto block h-6 w-6 animate-pulse rounded bg-line" role="status" aria-label="Loading" />
                ) : (
                  <span className="block text-2xl font-bold leading-tight">{s.value ?? "–"}</span>
                )}
                <span className="text-xs text-muted">{s.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card title="Contact" action={{ label: "Edit", to: editTo }}>
          <Field icon={Phone} label="Phone" value={phone} />
          <Field icon={Mail} label="Email" value={email} />
        </Card>

        <Card title="Default address" action={{ label: addressText ? "Change" : "Add", to: customerPath("/addresses") }}>
          {addressLoading ? (
            <div className="h-[132px] animate-pulse rounded-2xl bg-canvas" role="status" aria-label="Loading address" />
          ) : addressText ? (
            <>
              <div className="text-sm font-semibold text-ink">{addressLabel}</div>
              <p className="mt-0.5 text-sm text-muted">{addressText}</p>
              <div aria-hidden="true" className="relative mt-3 h-24 overflow-hidden rounded-2xl bg-gradient-to-br from-[#DDE8FF] to-[#C9D6FF]">
                <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent_0_22px,rgba(67,56,202,.12)_22px_23px),repeating-linear-gradient(90deg,transparent_0_22px,rgba(67,56,202,.12)_22px_23px)]" />
                <MapPin className="absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-[60%] fill-brand text-white" />
              </div>
            </>
          ) : (
            <p className="text-sm text-muted">No address yet. Add one so partners know where to come.</p>
          )}
        </Card>

        <Card title="Shortcuts">
          <ul>
            {SHORTCUTS.map(({ label, to, icon: Icon, tone }) => (
              <li key={label} className="border-b border-dashed border-line last:border-0">
                <Link to={customerPath(to)} className={clsx("group flex items-center gap-3 rounded-xl py-2.5", FOCUS_RING)}>
                  <span aria-hidden="true" className={clsx("flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br text-white", DISC, tone)}>
                    <Icon className="h-[17px] w-[17px]" />
                  </span>
                  <span className="text-sm font-medium text-ink">{label}</span>
                  <ChevronRight className="ml-auto h-4 w-4 text-muted transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
