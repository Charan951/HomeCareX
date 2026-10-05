import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronRight, FileText, LogOut, ShieldCheck, SlidersHorizontal, type LucideIcon } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { BOTTOM_KEYS, NAV } from "../../layouts/PartnerLayout";
import EditProfileSheet from "./EditProfileSheet";
import type { PartnerProfileInput } from "@/services/partnerApi";

interface MenuItem { key: string; label: string; to: string; description: string; icon: LucideIcon }

// Profile's own pages
const PROFILE_ITEMS: MenuItem[] = [
  { key: "documents", label: "Documents", to: "/partner/profile/documents", description: "KYC and certificates", icon: FileText },
  { key: "verification", label: "Verification status", to: "/partner/profile/verification", description: "Track your approval", icon: ShieldCheck },
  { key: "preferences", label: "Preferences", to: "/partner/profile/preferences", description: "Language and job preferences", icon: SlidersHorizontal },
];

const DESCRIPTIONS: Record<string, string> = {
  availability: "Working hours and blackout dates",
  services: "Categories, service radius, training",
  performance: "Ratings, reviews, improvement tips",
  support: "Tickets, safety and SOS",
  system: "Notification and app settings",
};

function MenuList({ title, items }: { title: string; items: MenuItem[] }) {
  return (
    <section aria-label={title}>
      <h3 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</h3>
      <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white">
        {items.map(({ key, label, to, description, icon: Icon }) => (
          <li key={key}>
            <Link
              to={to}
              className="flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#4338ca]"
            >
              <Icon size={20} className="shrink-0 text-[#4338ca]" aria-hidden />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-slate-900">{label}</span>
                <span className="block truncate text-xs text-slate-500">{description}</span>
              </span>
              <ChevronRight size={18} className="shrink-0 text-slate-400" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * Profile landing page = the single place for everything that is not in the bottom bar.
 * 0) profile card with an Edit button (opens EditProfileSheet), 1) the profile's other pages,
 * 2) every other menu page (built from NAV + BOTTOM_KEYS), 3) sign out.
 */
export default function ProfileMenu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<PartnerProfileInput>({
    name: user?.name ?? "Partner",
    phone: (user?.phone ?? "").replace(/\D/g, "").slice(-10),
  });
  const [editing, setEditing] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(""), 3000);
    return () => clearTimeout(t);
  }, [notice]);

  const moreItems: MenuItem[] = NAV.filter((n) => !BOTTOM_KEYS.includes(n.key)).map((n) => ({
    key: n.key,
    label: n.label,
    to: n.to,
    description: DESCRIPTIONS[n.key] ?? "",
    icon: n.icon,
  }));

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <section aria-label="Your profile" className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <span
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#4338ca] text-xl font-semibold text-white"
            aria-hidden
          >
            {profile.name.charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-lg font-semibold text-slate-900">{profile.name}</h2>
            <p className="text-sm text-slate-500">Partner account</p>
          </div>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="shrink-0 rounded-full border border-[#4338ca] px-4 py-1.5 text-sm font-semibold text-[#4338ca] hover:bg-indigo-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#4338ca]"
          >
            Edit
          </button>
        </div>

        <dl className="mt-4 divide-y divide-slate-100 border-t border-slate-100 text-sm">
          <div className="flex items-center justify-between gap-4 py-2.5">
            <dt className="text-slate-500">Mobile</dt>
            <dd className="font-medium text-slate-900">{profile.phone ? `+91 ${profile.phone}` : "Not added"}</dd>
          </div>
          <div className="flex items-center justify-between gap-4 py-2.5">
            <dt className="text-slate-500">Email</dt>
            <dd className="min-w-0 truncate font-medium text-slate-900">{user?.email ?? "Not added"}</dd>
          </div>
        </dl>
      </section>

      {notice && (
        <p role="status" className="rounded-xl bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-700">
          {notice}
        </p>
      )}

      <MenuList title="My profile" items={PROFILE_ITEMS} />
      <MenuList title="More" items={moreItems} />

      <button
        type="button"
        onClick={async () => {
          await logout();
          navigate("/login", { replace: true });
        }}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#4338ca]"
      >
        <LogOut size={18} aria-hidden /> Sign out
      </button>

      {editing && (
        <EditProfileSheet
          initial={profile}
          email={user?.email}
          onClose={() => setEditing(false)}
          onSaved={(value) => {
            setProfile(value);
            setEditing(false);
            setNotice("Profile updated.");
          }}
        />
      )}
    </div>
  );
}