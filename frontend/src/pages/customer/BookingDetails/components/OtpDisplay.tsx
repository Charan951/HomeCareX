import { useState } from "react";
import { Copy, Check, ShieldCheck } from "lucide-react";

/**
 * The start code. The customer reads it out to the partner at the door; the partner types it in to begin.
 * Shown only while the partner has arrived (the server sends nothing otherwise).
 */
export default function OtpDisplay({ code }: { code: string | null }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable: the code is still on screen */
    }
  };

  return (
    <section
      aria-labelledby="otp-heading"
      className="rounded-2xl border border-brand/20 bg-brand-soft p-4 sm:p-5"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <ShieldCheck
            className="mt-0.5 h-5 w-5 shrink-0 text-brand"
            aria-hidden="true"
          />
          <div className="min-w-0">
            <h2 id="otp-heading" className="text-sm font-bold text-ink">
              Start Service OTP
            </h2>
            <p className="mt-0.5 text-sm text-muted">
              Share this OTP with your partner when they arrive at your
              location.
            </p>
            <div className="mt-3 flex items-center gap-2">
              <p
                role="status"
                aria-label={
                  code
                    ? `Start code ${code.split("").join(" ")}`
                    : "Start code not available yet"
                }
                className="flex gap-2"
              >
                {(code ? code.split("") : ["•", "•", "•", "•"]).map(
                  (digit, i) => (
                    <span
                      key={i}
                      aria-hidden="true"
                      className="flex h-11 w-9 items-center justify-center rounded-lg border border-line bg-panel text-xl font-bold tabular-nums text-ink shadow-sm sm:h-12 sm:w-10"
                    >
                      {digit}
                    </span>
                  ),
                )}
              </p>
              <button
                type="button"
                onClick={() => void copy()}
                disabled={!code}
                aria-label={copied ? "Code copied" : "Copy code"}
                className="flex h-11 w-9 items-center justify-center rounded-lg border border-line bg-panel text-muted transition hover:text-brand disabled:opacity-40 sm:h-12 sm:w-10"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-emerald-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        </div>
        <p className="text-xs text-muted sm:max-w-[16rem] sm:border-l sm:border-line sm:pl-4">
          This OTP will be active once your partner reaches the location.
        </p>
      </div>
    </section>
  );
}
