import { Info } from "lucide-react";
import type { ReactNode } from "react";
import type { Incentive, IncentiveStatus } from "@/types/incentives";
import { inr, lastDay, plural, shortDate } from "./incentivesFormat";

const STATUS_LABEL: Record<IncentiveStatus, string> = {
  active: "Active",
  upcoming: "Upcoming",
  completed: "Completed",
  expired: "Ended",
};

/** One line with everything the partner needs next. */
function summaryLine(i: Incentive): ReactNode {
  switch (i.status) {
    case "active":
      return (
        <>
          {i.remainingJobs > 0 ? <strong>{plural(i.remainingJobs, "more job")}</strong> : "Target reached, waiting on eligibility"}
          {i.daysLeft !== null && <> · {i.daysLeft === 0 ? "ends today" : `${plural(i.daysLeft, "day")} left`}</>}
          {" · ends "}
          {lastDay(i.endsAt)}
        </>
      );
    case "upcoming":
      return (
        <>
          Target <strong>{plural(i.targetJobs, "job")}</strong> · starts{" "}
          {i.startsInDays === 0 ? "today" : `in ${plural(i.startsInDays ?? 0, "day")}`} · {shortDate(i.startsAt)} to {lastDay(i.endsAt)}
        </>
      );
    case "completed":
      return (
        <>
          Target reached{i.achievedAt ? ` on ${shortDate(i.achievedAt)}` : ""} · <strong>{inr(i.rewardAmount)} earned</strong>
        </>
      );
    default:
      return (
        <>
          Ended {lastDay(i.endsAt)} · {i.completedJobs} of {i.targetJobs} jobs
        </>
      );
  }
}

export default function IncentiveCard({ incentive: i, delay }: { incentive: Incentive; delay: number }) {
  const hasProgress = i.status !== "upcoming";
  const percent = Math.max(0, Math.min(100, i.percent));
  const titleId = `inc-title-${i.id}`;

  return (
    <article className={`inc-card inc-card--${i.status}`} style={{ animationDelay: `${delay}ms` }} aria-labelledby={titleId}>
      <header className="inc-card-head">
        <div className="inc-card-titles">
          <span className={`inc-status inc-status--${i.status}`}>{STATUS_LABEL[i.status]}</span>
          <h3 id={titleId} className="inc-card-title">
            {i.title}
          </h3>
        </div>
        <div className="inc-reward">
          <span>Reward</span>
          <strong>{inr(i.rewardAmount)}</strong>
        </div>
      </header>

      {i.description && <p className="inc-desc">{i.description}</p>}

      {hasProgress && (
        <div className="inc-progress-block">
          <div className="inc-progress-label">
            <span>
              <strong>{i.completedJobs}</strong> of {plural(i.targetJobs, "job")}
            </span>
            <span>{percent}%</span>
          </div>
          <div
            className="inc-progress"
            role="progressbar"
            aria-label={`${i.title}: ${i.completedJobs} of ${i.targetJobs} jobs completed`}
            aria-valuemin={0}
            aria-valuemax={i.targetJobs}
            aria-valuenow={Math.min(i.completedJobs, i.targetJobs)}
          >
            <div className="inc-progress-fill" style={{ width: `${percent}%` }} />
          </div>
        </div>
      )}

      <p className={`inc-meta${i.status === "completed" ? " inc-meta--done" : ""}`}>{summaryLine(i)}</p>

      {!i.eligible && i.ineligibleReason && i.status !== "expired" && (
        <p className="inc-warn" role="status">
          <Info size={15} aria-hidden /> <span>{i.ineligibleReason}</span>
        </p>
      )}

      <details className="inc-rules">
        <summary>How it works</summary>
        <ul>
          {i.rules.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      </details>
    </article>
  );
}