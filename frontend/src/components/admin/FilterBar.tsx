import React from 'react';
import { RotateCcw } from 'lucide-react';
import { SearchInput } from './SearchInput';

interface FilterBarProps {
  search?: { value: string; onChange: (value: string) => void; placeholder?: string };
  /** FilterSelect, DateRangePicker or any control. */
  children?: React.ReactNode;
  /** Number of filters currently applied; the reset button shows when > 0. */
  activeCount?: number;
  onReset?: () => void;
  /** Right-aligned extras, e.g. ExportButton. */
  trailing?: React.ReactNode;
}

export const FilterBar: React.FC<FilterBarProps> = ({ search, children, activeCount = 0, onReset, trailing }) => (
  <div className="hcx-filterbar" role="search">
    {search && <SearchInput {...search} />}
    {children}
    {onReset && activeCount > 0 && (
      <button type="button" className="hcx-btn hcx-btn--ghost" onClick={onReset}>
        <RotateCcw size={14} /> Reset ({activeCount})
      </button>
    )}
    {trailing && <div className="hcx-filterbar__trailing">{trailing}</div>}
  </div>
);

interface FilterSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { label: string; value: string }[];
  /** Label of the "no filter" option. */
  allLabel?: string;
}

/** A labelled native <select>; empty string means "all". */
export const FilterSelect: React.FC<FilterSelectProps> = ({ label, value, onChange, options, allLabel = 'All' }) => (
  <label className="hcx-filter-select">
    <span className="sr-only">{label}</span>
    <select value={value} onChange={(e) => onChange(e.target.value)} aria-label={label}>
      <option value="">{label}: {allLabel}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  </label>
);

export default FilterBar;
