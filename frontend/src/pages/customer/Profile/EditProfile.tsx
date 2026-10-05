import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Check } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { customerPath } from "@/routes/customerPath";
import { FOCUS_RING } from "@/components/customer/focusRing";
import { initialsOf } from "./ProfileHero";

const INPUT =
  "h-12 w-full rounded-xl border border-line bg-panel px-4 text-[15px] text-ink outline-none transition-shadow placeholder:text-muted/70 focus:border-brand focus:ring-4 focus:ring-brand/15";

/** Edit profile: name, email and phone. Saves through the auth context's login() so the UI updates immediately. */
export default function EditProfile() {
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");

  const valid = name.trim().length > 1 && /^\S+@\S+\.\S+$/.test(email.trim());

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!valid || !user) return;
    updateProfile({ name: name.trim(), email: email.trim(), phone: phone.trim() || undefined });
    navigate(customerPath("/profile"));
  };

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <Link to={customerPath("/profile")} className={`inline-flex items-center gap-1.5 rounded text-sm font-medium text-muted hover:text-ink ${FOCUS_RING}`}>
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to profile
      </Link>

      <div className="flex items-center gap-4">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-brand to-[#7C6CF6] text-xl font-bold text-white shadow-lg" aria-hidden="true">
          {initialsOf(name)}
        </span>
        <div>
          <h1 className="text-xl font-bold text-ink">Edit profile</h1>
          <p className="text-sm text-muted">Update your personal details.</p>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-4 rounded-[24px] border border-line/70 bg-panel p-5 shadow-[0_10px_28px_-12px_rgba(30,27,46,.14)]">
        <label className="block space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted">Full name</span>
          <input className={INPUT} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required />
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted">Email</span>
          <input className={INPUT} type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted">Phone</span>
          <input className={INPUT} type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" placeholder="+91 98765 43210" />
        </label>

        <div className="flex gap-3 pt-2">
          <Link to={customerPath("/profile")} className={`flex h-12 flex-1 items-center justify-center rounded-full border border-line text-sm font-semibold text-ink hover:bg-canvas ${FOCUS_RING}`}>
            Cancel
          </Link>
          <button
            type="submit"
            disabled={!valid}
            className={`flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-brand text-sm font-semibold text-white shadow-[0_8px_18px_-8px_rgba(67,56,202,.7)] transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 motion-safe:active:scale-[.97] ${FOCUS_RING}`}
          >
            <Check className="h-4 w-4" aria-hidden="true" /> Save changes
          </button>
        </div>
      </form>
    </div>
  );
}
