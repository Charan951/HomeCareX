import { Download, Loader2 } from "lucide-react";
import type { EarningStatus, EarningsFilters } from "@/types/earnings";
import { PRESETS, activePreset, presetRange, type PresetId } from "./earningsFormat";

interface Props {
  value: EarningsFilters;
  onChange: (next: EarningsFilters) => void;
  error: string | null;
  canDownload: boolean;
  downloading: boolean;
  onDownload: () => void;
}

export default function EarningsFilterBar({ value, onChange, error, canDownload, downloading, onDownload }: Props) {
  const active = activePreset(value.from, value.to);
  const pickPreset = (id: PresetId) => onChange({ ...presetRange(id), status: value.status });

  return (
    <div className="earn-filters">
      <div className="earn-chips" role="group" aria-label="Quick date ranges">
        {PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            className="earn-chipbtn"
            aria-pressed={active === p.id}
            onClick={() => pickPreset(p.id)}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="earn-fields">
        <label className="earn-field">
          <span>From</span>
          <input
            type="date"
            value={value.from ?? ""}
            max={value.to || undefined}
            onChange={(e) => onChange({ ...value, from: e.target.value || undefined })}
            aria-invalid={!!error}
          />
        </label>
        <label className="earn-field">
          <span>To</span>
          <input
            type="date"
            value={value.to ?? ""}
            min={value.from || undefined}
            onChange={(e) => onChange({ ...value, to: e.target.value || undefined })}
            aria-invalid={!!error}
          />
        </label>
        <label className="earn-field">
          <span>Status</span>
          <select
            value={value.status ?? ""}
            onChange={(e) => onChange({ ...value, status: (e.target.value || undefined) as EarningStatus | undefined })}
          >
            <option value="">All</option>
            <option value="pending">Pending payout</option>
            <option value="settled">Paid out</option>
          </select>
        </label>

        <button type="button" className="earn-download" onClick={onDownload} disabled={!canDownload || downloading || !!error}>
          {downloading ? <Loader2 size={16} className="earn-spin" aria-hidden /> : <Download size={16} aria-hidden />}
          {downloading ? "Preparing..." : "Download CSV"}
        </button>
      </div>

      {error && (
        <p className="earn-form-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}