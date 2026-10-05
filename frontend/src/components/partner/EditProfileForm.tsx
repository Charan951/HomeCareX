import { useId, useState, type FormEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { partnerApi } from "@/services/partnerApi";

const PHONE_RE = /^[6-9]\d{9}$/;

interface Errors { name?: string; phone?: string }

function validate(name: string, phone: string): Errors {
  const errors: Errors = {};
  const n = name.trim();
  if (n.length < 2) errors.name = "Enter your full name (at least 2 characters).";
  else if (n.length > 60) errors.name = "Name is too long (max 60 characters).";
  if (phone && !PHONE_RE.test(phone)) errors.phone = "Enter a valid 10-digit mobile number.";
  return errors;
}

/** Edit-profile form shown on the Profile page. Email comes from the account and is read-only. */
export default function EditProfileForm() {
  const { user } = useAuth();
  const uid = useId();
  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState((user?.phone ?? "").replace(/\D/g, "").slice(-10));
  const [errors, setErrors] = useState<Errors>({});
  const [saved, setSaved] = useState(false);

  const save = useMutation({
    mutationFn: partnerApi.updateProfile,
    onSuccess: () => setSaved(true),
  });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSaved(false);
    const found = validate(name, phone);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    save.mutate({ name: name.trim(), phone });
  };

  const input =
    "mt-1 block w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-ink placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand";

  return (
    <section aria-labelledby={`${uid}-title`} className="rounded-xl border border-slate-200 bg-white p-4">
      <h3 id={`${uid}-title`} className="text-sm font-semibold text-slate-900">Edit profile</h3>

      <form onSubmit={onSubmit} noValidate className="mt-3 space-y-4">
        <div>
          <label htmlFor={`${uid}-name`} className="text-xs font-medium text-slate-600">Full name</label>
          <input
            id={`${uid}-name`}
            value={name}
            onChange={(e) => { setName(e.target.value); setSaved(false); }}
            autoComplete="name"
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? `${uid}-name-err` : undefined}
            className={`${input} ${errors.name ? "border-red-400" : "border-slate-300"}`}
          />
          {errors.name && <p id={`${uid}-name-err`} className="mt-1 text-xs text-red-600">{errors.name}</p>}
        </div>

        <div>
          <label htmlFor={`${uid}-phone`} className="text-xs font-medium text-slate-600">Mobile number</label>
          <input
            id={`${uid}-phone`}
            value={phone}
            onChange={(e) => { setPhone(e.target.value.replace(/\D/g, "").slice(0, 10)); setSaved(false); }}
            inputMode="numeric"
            autoComplete="tel-national"
            placeholder="10-digit number"
            aria-invalid={!!errors.phone}
            aria-describedby={errors.phone ? `${uid}-phone-err` : undefined}
            className={`${input} ${errors.phone ? "border-red-400" : "border-slate-300"}`}
          />
          {errors.phone && <p id={`${uid}-phone-err`} className="mt-1 text-xs text-red-600">{errors.phone}</p>}
        </div>

        <div>
          <label htmlFor={`${uid}-email`} className="text-xs font-medium text-slate-600">Email</label>
          <input
            id={`${uid}-email`}
            value={user?.email ?? ""}
            readOnly
            aria-describedby={`${uid}-email-hint`}
            className={`${input} cursor-not-allowed border-slate-200 bg-slate-50 text-slate-500`}
          />
          <p id={`${uid}-email-hint`} className="mt-1 text-xs text-slate-500">Email can't be changed here.</p>
        </div>

        {save.isError && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            Couldn't save your changes. Please try again.
          </p>
        )}
        {saved && (
          <p role="status" className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            Profile updated.
          </p>
        )}

        <button
          type="submit"
          disabled={save.isPending}
          className="w-full rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
        >
          {save.isPending ? "Saving…" : "Save changes"}
        </button>
      </form>
    </section>
  );
}