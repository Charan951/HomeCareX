import { useState } from "react";
import type { ReactNode } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { ChevronDown, History } from "lucide-react";
import ErrorState from "@/components/common/ErrorState";
import Skeleton from "@/components/common/Skeleton";
import { earningsApi } from "@/services/earningsApi";
import type { ApiError } from "@/lib/http";
import type { EarningsFilters, EarningsLedger } from "@/types/earnings";
import EarningsChart from "./EarningsChart";
import EarningsFilterBar from "./EarningsFilters";
import EarningsTable from "./EarningsTable";
import { inr, presetRange, rangeError } from "./earningsFormat";

const PAGE_SIZES = [5, 10, 20] as const;

/** Slim header with a show/hide button, so the chart and table can be folded away to save space. */
function SectionToggle({
  label, open, onToggle, controls, children,
}: { label: string; open: boolean; onToggle: () => void; controls: string; children?: ReactNode }) {
  return (
    <div className="earn-collapse">
      <button type="button" className="earn-collapse-btn" onClick={onToggle} aria-expanded={open} aria-controls={controls}>
        <ChevronDown size={16} aria-hidden className={open ? "" : "earn-collapse-icon--closed"} />
        {label}
        <span className="earn-collapse-state">{open ? "Hide" : "Show"}</span>
      </button>
      {children}
    </div>
  );
}

/** Hands the CSV to the browser's normal download flow. */
function saveBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function EarningsHistory() {
  const [filters, setFilters] = useState<EarningsFilters>(() => presetRange("month"));
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(PAGE_SIZES[0]);
  const [chartOpen, setChartOpen] = useState(true);
  const [tableOpen, setTableOpen] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const invalid = rangeError(filters.from, filters.to);

  const { data, isPending, isError, error, isFetching, refetch } = useQuery<EarningsLedger, ApiError>({
    queryKey: ["partner", "earnings", "ledger", filters, page, pageSize],
    queryFn: () => earningsApi.getLedger({ ...filters, page, limit: pageSize }),
    enabled: !invalid,
    placeholderData: keepPreviousData, // keep the old rows on screen while the next filter loads
    retry: 1,
  });

  const changeFilters = (next: EarningsFilters) => {
    setFilters(next);
    setPage(1);
    setDownloadError(null);
  };

  const download = async () => {
    setDownloading(true);
    setDownloadError(null);
    try {
      const { blob, filename } = await earningsApi.exportCsv(filters);
      saveBlob(blob, filename);
    } catch (e) {
      setDownloadError((e as ApiError).message || "Could not download the file. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  let content;
  if (invalid) {
    content = null; // the filter bar already shows the message
  } else if (isPending) {
    content = (
      <div className="earn-stack" role="status" aria-label="Loading earnings history">
        <Skeleton className="earn-skel earn-skel--chart" />
        <Skeleton className="earn-skel earn-skel--table" />
      </div>
    );
  } else if (isError || !data) {
    content = <ErrorState message={error?.message} onRetry={() => void refetch()} />;
  } else {
    const t = data.totals;
    content =
      t.count === 0 ? null : (
        <>
          <p className="earn-totals" aria-live="polite">
            <strong>{t.count}</strong> {t.count === 1 ? "earning" : "earnings"} · Gross {inr(t.gross)} · Commission{" "}
            {inr(t.commission)} · <strong>You earned {inr(t.net)}</strong>
          </p>
          <div className="earn-split">
          <div className="earn-split-chart">
            <SectionToggle label="Earnings chart" open={chartOpen} onToggle={() => setChartOpen((v) => !v)} controls="earn-chart-body" />
            {chartOpen && (
              <div id="earn-chart-body" className="earn-chart-card" aria-busy={isFetching}>
                <EarningsChart series={data.series} />
              </div>
            )}
          </div>
          <div className="earn-split-table">
          <SectionToggle label="Earnings list" open={tableOpen} onToggle={() => setTableOpen((v) => !v)} controls="earn-table-body">
            {tableOpen && (
              <label className="earn-rows">
                Rows
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                  }}
                >
                  {PAGE_SIZES.map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </label>
            )}
          </SectionToggle>
          {tableOpen && (
            <div id="earn-table-body">
              <EarningsTable rows={data.items} pagination={data.pagination} onPage={setPage} busy={isFetching} />
            </div>
          )}
          </div>
          </div>
        </>
      );
  }

  return (
    <section className="earn-history" aria-label="Earnings history">
      <h2 className="earn-section">
        <History size={16} aria-hidden /> Earnings history
      </h2>
      <EarningsFilterBar
        value={filters}
        onChange={changeFilters}
        error={invalid ?? downloadError}
        canDownload={!!data && data.totals.count > 0}
        downloading={downloading}
        onDownload={() => void download()}
      />
      {content}
    </section>
  );
}