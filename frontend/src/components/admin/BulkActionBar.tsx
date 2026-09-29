import React from 'react';
import { X } from 'lucide-react';
import clsx from 'clsx';

export interface BulkAction {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
  tone?: 'default' | 'danger';
  disabled?: boolean;
}

interface BulkActionBarProps {
  selectedCount: number;
  actions: BulkAction[];
  onClear: () => void;
  /** e.g. "bookings" -> "3 bookings selected" */
  noun?: string;
}

/** Appears above a DataTable once rows are selected. Renders nothing at 0. */
export const BulkActionBar: React.FC<BulkActionBarProps> = ({ selectedCount, actions, onClear, noun = 'selected' }) => {
  if (selectedCount === 0) return null;
  return (
    <div className="hcx-bulkbar" role="region" aria-label="Bulk actions">
      <span className="hcx-bulkbar__count" aria-live="polite">
        {selectedCount} {noun === 'selected' ? 'selected' : `${noun} selected`}
      </span>
      <div className="hcx-bulkbar__actions">
        {actions.map((a) => (
          <button
            key={a.label}
            type="button"
            className={clsx('hcx-btn', a.tone === 'danger' && 'hcx-btn--danger-ghost')}
            onClick={a.onClick}
            disabled={a.disabled}
          >
            {a.icon}
            {a.label}
          </button>
        ))}
      </div>
      <button type="button" className="hcx-bulkbar__clear" onClick={onClear} aria-label="Clear selection">
        <X size={16} />
      </button>
    </div>
  );
};

export default BulkActionBar;
