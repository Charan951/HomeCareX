import React from 'react';
import { BarChart3 } from 'lucide-react';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  /** Right side of the header: DateRangePicker, ExportButton, a select… */
  actions?: React.ReactNode;
  loading?: boolean;
  error?: string;
  /** When true shows the empty state instead of children. */
  empty?: boolean;
  emptyMessage?: string;
  /** Fixed height for the chart area so the card doesn't jump while loading. */
  height?: number;
  children?: React.ReactNode;
}

/** Frame for any chart. It does not draw charts itself, so any chart library can go inside. */
export const ChartCard: React.FC<ChartCardProps> = ({
  title, subtitle, actions, loading, error, empty, emptyMessage = 'No data for this period', height = 280, children,
}) => (
  <section className="hcx-card hcx-chart-card">
    <header className="hcx-card__head">
      <div>
        <h2 className="hcx-card__title">{title}</h2>
        {subtitle && <p className="hcx-card__sub">{subtitle}</p>}
      </div>
      {actions && <div className="hcx-card__actions">{actions}</div>}
    </header>
    <div className="hcx-chart-card__body" style={{ minHeight: height }}>
      {loading ? (
        <div className="hcx-skeleton hcx-skeleton--block" style={{ height }} aria-label="Loading chart" />
      ) : error ? (
        <div className="hcx-empty hcx-empty--error" role="alert">{error}</div>
      ) : empty ? (
        <div className="hcx-empty">
          <BarChart3 size={28} aria-hidden />
          <p>{emptyMessage}</p>
        </div>
      ) : (
        children
      )}
    </div>
  </section>
);

export default ChartCard;
