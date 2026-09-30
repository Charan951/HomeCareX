import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Briefcase, CalendarCheck, CheckCircle2, IndianRupee, Star } from "lucide-react";
import KpiCard from "@/components/partner/KpiCard";
import ActiveJobCard from "@/components/partner/ActiveJobCard";
import OnlineIndicator from "@/components/partner/OnlineIndicator";
import ErrorState from "@/components/common/ErrorState";
import OfflineState from "@/components/common/OfflineState";
import Skeleton from "@/components/common/Skeleton";
import { usePartnerStatus } from "@/layouts/PartnerLayout";
import { useAuth } from "@/hooks/useAuth";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { partnerApi } from "@/services/partnerApi";
import type { ApiError } from "@/lib/http";

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
};
const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

function DashboardSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-label="Loading dashboard">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <Skeleton className="h-40 lg:col-span-2" />
        <Skeleton className="h-40" />
      </div>
    </div>
  );
}

export default function PartnerDashboard() {
  const { online, setOnline } = usePartnerStatus();
  const { user } = useAuth();
  const networkOnline = useOnlineStatus();
  const { data, isPending, isError, error, refetch } = useQuery<Awaited<ReturnType<typeof partnerApi.getDashboard>>, ApiError>({
    queryKey: ["partner", "dashboard"],
    queryFn: partnerApi.getDashboard,
    retry: 1,
    refetchInterval: 30_000,
  });

  let body;
  if (!data && !networkOnline) {
    body = <OfflineState onRetry={() => void refetch()} />;
  } else if (isPending) {
    body = <DashboardSkeleton />;
  } else if (isError || !data) {
    body = <ErrorState message={error?.message} onRetry={() => void refetch()} />;
  } else {
    body = (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <KpiCard label="New jobs" value={data.newJobs} icon={Briefcase} hint="Waiting for your reply" />
          <KpiCard label="Today's jobs" value={data.todayJobs} icon={CalendarCheck} hint="Scheduled for today" />
          <KpiCard label="Completed" value={data.completedJobs} icon={CheckCircle2} hint="Finished today" />
          <KpiCard label="Today's earnings" value={inr(data.todayEarnings)} icon={IndianRupee} hint="Your share after commission" />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <section className="space-y-6 lg:col-span-2">
            <div>
              <h3 className="mb-2 font-semibold text-slate-800">Active job</h3>
              <ActiveJobCard job={data.activeJob} />
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <h3 className="font-semibold text-slate-800">Job requests</h3>
              <p className="mt-1 text-sm text-slate-600">
                {data.newJobs > 0 ? `${data.newJobs} new ${data.newJobs === 1 ? "request is" : "requests are"} waiting.` : "No new requests right now."}
              </p>
              <Link to="/partner/work/requests" className="mt-3 inline-block text-sm font-medium text-[#4338ca] hover:underline">
                View job requests
              </Link>
            </div>
          </section>

          <aside className="space-y-6">
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <h3 className="flex items-center gap-2 font-semibold text-slate-800">
                <Star size={16} className="text-[#ff8a3d]" aria-hidden />
                Performance
              </h3>
              <dl className="mt-3 space-y-2 text-sm">
                {[
                  ["Rating", data.rating > 0 ? `${data.rating.toFixed(1)} / 5` : "No ratings yet"],
                  ["Acceptance rate", `${data.acceptanceRate}%`],
                  ["Completion rate", `${data.completionRate}%`],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between">
                    <dt className="text-slate-500">{k}</dt>
                    <dd className="font-medium text-slate-900">{v}</dd>
                  </div>
                ))}
              </dl>
              <Link to="/partner/performance" className="mt-3 inline-block text-sm font-medium text-[#4338ca] hover:underline">
                See scorecard
              </Link>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <h3 className="font-semibold text-slate-800">Earnings</h3>
              <p className="mt-1 text-2xl font-semibold text-slate-900">{inr(data.todayEarnings)}</p>
              <p className="text-sm text-slate-500">Earned today</p>
              <Link to="/partner/earnings" className="mt-3 inline-block text-sm font-medium text-[#4338ca] hover:underline">
                See full earnings
              </Link>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <h3 className="font-semibold text-slate-800">Notifications</h3>
              <Link to="/partner/system/notifications" className="mt-2 inline-block text-sm font-medium text-[#4338ca] hover:underline">
                Open notification settings
              </Link>
            </div>
          </aside>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-semibold text-slate-900">
          {greeting()}, {user?.name ?? "Partner"}
        </h2>
        <OnlineIndicator online={online} onChange={setOnline} />
      </div>
      {body}
    </div>
  );
}