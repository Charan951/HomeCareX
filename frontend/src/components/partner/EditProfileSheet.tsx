import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { partnerApi, type PartnerProfileInput } from "@/services/partnerApi";

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

interface Props {
  initial: PartnerProfileInput;
  email?: string;
  onClose: () => void;
  onSaved: (value: PartnerProfileInput) => void;
}

/**
 * Bottom sheet (centered dialog on tablets and up) for editing name and phone.
 * Mount it only while open: its form state starts fresh from `initial` every time.
 */
export default function EditProfileSheet({ initial, email, onClose, onSaved }: Props) {
  const uid = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(initial.name);
  const [phone, setPhone] = useState(initial.phone);
  const [errors, setErrors] = useState<Errors>({});

  const save = useMutation({
    mutationFn: partnerApi.updateProfile,
    onSuccess: (value) => onSaved(value),
  });

  // Focus the first field, lock page scroll, and give focus back to the Edit button on close.
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    nameRef.current?.focus();
    return () => {
      document.body.style.overflow = prevOverflow;
      opener?.focus?.();
    };
  }, []);

  // Esc closes; Tab stays inside the sheet.
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      onClose();
      return;
    }
    if (e.key !== "Tab") return;
    const items = panelRef.current?.querySelectorAll<HTMLElement>("button:not([disabled]), input:not([readonly])");
    if (!items || items.length === 0) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const found = validate(name, phone);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    save.mutate({ name: name.trim(), phone });
  };

  const field =
    "mt-1.5 block w-full rounded-xl border bg-white px-3.5 py-3 text-sm text-ink placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" onKeyDown={onKeyDown}>
      <div className="absolute inset-0 bg-slate-900/50" onClick={onClose} aria-hidden />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${uid}-title`}
        className="relative w-full max-w-md rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl"
        style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom))" }}
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-slate-200 sm:hidden" aria-hidden />
        <h2 id={`${uid}-title`} className="text-lg font-semibold text-slate-900">Edit profile</h2>
        <p className="mt-0.5 text-sm text-slate-500">Update the details customers and support see.</p>

        <form onSubmit={onSubmit} noValidate className="mt-4 space-y-4">
          <div>
            <label htmlFor={`${uid}-name`} className="text-sm font-medium text-slate-700">Full name</label>
            <input
              ref={nameRef}
              id={`${uid}-name`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? `${uid}-name-err` : undefined}
              className={`${field} ${errors.name ? "border-red-400" : "border-slate-300"}`}
            />
            {errors.name && <p id={`${uid}-name-err`} className="mt-1 text-xs text-red-600">{errors.name}</p>}
          </div>

          <div>
            <label htmlFor={`${uid}-phone`} className="text-sm font-medium text-slate-700">Mobile number</label>
            <input
              id={`${uid}-phone`}
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
              inputMode="numeric"
              autoComplete="tel-national"
              placeholder="10-digit number"
              aria-invalid={!!errors.phone}
              aria-describedby={errors.phone ? `${uid}-phone-err` : undefined}
              className={`${field} ${errors.phone ? "border-red-400" : "border-slate-300"}`}
            />
            {errors.phone && <p id={`${uid}-phone-err`} className="mt-1 text-xs text-red-600">{errors.phone}</p>}
          </div>

          {email && (
            <p className="text-xs text-slate-500">
              Email <span className="font-medium text-slate-700">{email}</span> can't be changed here.
            </p>
          )}

          {save.isError && (
            <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
              Couldn't save your changes. Please try again.
            </p>
          )}

          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={save.isPending}
              className="rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
            >
              {save.isPending ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}