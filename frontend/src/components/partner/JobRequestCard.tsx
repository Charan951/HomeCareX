import {
  useEffect,
  useState,
} from "react";

import {
  MapPin,
  Timer,
} from "lucide-react";

import type {
  JobRequest,
} from "@/types/partner";

/* =========================================================
   HELPERS
========================================================= */

const secondsLeft = (
  expiresAt: string,
) => {
  return Math.max(
    0,
    Math.round(
      (new Date(
        expiresAt,
      ).getTime() -
        Date.now()) /
        1000,
    ),
  );
};

const clock = (
  seconds: number,
) => {
  return `${Math.floor(
    seconds / 60,
  )}:${String(
    seconds % 60,
  ).padStart(2, "0")}`;
};

/* =========================================================
   PROPS
========================================================= */

interface Props {
  request: JobRequest;

  onAccept: (
    id: string,
  ) => void;

  onReject: (
    id: string,
  ) => void;
}

/* =========================================================
   JOB REQUEST CARD
========================================================= */

export default function JobRequestCard({
  request,
  onAccept,
  onReject,
}: Props) {
  const [
    left,
    setLeft,
  ] = useState(() =>
    secondsLeft(
      request.expiresAt,
    ),
  );

  /* =======================================================
     COUNTDOWN
  ======================================================= */

  useEffect(() => {
    setLeft(
      secondsLeft(
        request.expiresAt,
      ),
    );

    const timer =
      window.setInterval(() => {
        setLeft(
          secondsLeft(
            request.expiresAt,
          ),
        );
      }, 1000);

    return () => {
      window.clearInterval(
        timer,
      );
    };
  }, [
    request.expiresAt,
  ]);

  /* =======================================================
     EXPIRED
  ======================================================= */

  const expired =
    left === 0;

  /* =======================================================
     SCHEDULED TIME
  ======================================================= */

  const when =
    new Date(
      request.scheduledAt,
    ).toLocaleTimeString(
      [],
      {
        hour: "numeric",
        minute: "2-digit",
      },
    );

  /* =======================================================
     UI
  ======================================================= */

  return (
    <li className="rounded border border-line bg-panel p-4">
      {/* ---------------------------------------------------
          HEADER
      --------------------------------------------------- */}

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-ink">
            {request.service}
          </p>

          <p className="mt-0.5 flex items-center gap-1 text-xs text-muted">
            <MapPin
              size={13}
              aria-hidden="true"
            />

            {request.area}

            {" · "}

            {when}

            {" · "}

            ₹
            {request.price.toLocaleString(
              "en-IN",
            )}
          </p>
        </div>

        {/* -------------------------------------------------
            COUNTDOWN
        ------------------------------------------------- */}

        <span
          className={`flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
            expired
              ? "bg-canvas text-muted"
              : "bg-accent-soft text-[#b45309]"
          }`}
          role="timer"
          aria-label={
            expired
              ? "Expired"
              : `${left} seconds left to respond`
          }
        >
          <Timer
            size={12}
            aria-hidden="true"
          />

          {expired
            ? "Expired"
            : clock(left)}
        </span>
      </div>

      {/* ---------------------------------------------------
          ACTIONS
      --------------------------------------------------- */}

      <div className="mt-3 flex gap-2">
        {/* REJECT */}

        <button
          type="button"
          onClick={() =>
            onReject(
              request.id,
            )
          }
          disabled={expired}
          className="rounded border border-line px-3 py-1.5 text-sm text-ink hover:bg-canvas disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
        >
          Reject
        </button>

        {/* ACCEPT */}

        <button
          type="button"
          onClick={() =>
            onAccept(
              request.id,
            )
          }
          disabled={expired}
          className="rounded bg-brand px-3 py-1.5 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
        >
          Accept
        </button>
      </div>
    </li>
  );
}