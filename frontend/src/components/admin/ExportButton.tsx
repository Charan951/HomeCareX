import React, { useState } from 'react';
import { ChevronDown, Download } from 'lucide-react';
import { useClickOutside } from '@/hooks/useClickOutside';

export type ExportFormat = 'csv' | 'xlsx' | 'pdf';

const LABELS: Record<ExportFormat, string> = { csv: 'CSV', xlsx: 'Excel (.xlsx)', pdf: 'PDF' };

interface ExportButtonProps {
  /** Called with the chosen format. Return a promise to show the busy state. */
  onExport: (format: ExportFormat) => void | Promise<void>;
  formats?: ExportFormat[];
  label?: string;
  disabled?: boolean;
}

export const ExportButton: React.FC<ExportButtonProps> = ({
  onExport, formats = ['csv'], label = 'Export', disabled,
}) => {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const ref = useClickOutside<HTMLDivElement>(open, () => setOpen(false));

  const run = async (format: ExportFormat) => {
    setOpen(false);
    setBusy(true);
    try {
      await onExport(format);
    } finally {
      setBusy(false);
    }
  };

  // One format = a plain button, no menu.
  if (formats.length === 1) {
    return (
      <button type="button" className="hcx-btn" disabled={disabled || busy} onClick={() => run(formats[0])}>
        <Download size={16} /> {busy ? 'Exporting…' : label}
      </button>
    );
  }

  return (
    <div className="popover" ref={ref}>
      <button
        type="button"
        className="hcx-btn"
        disabled={disabled || busy}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <Download size={16} /> {busy ? 'Exporting…' : label} <ChevronDown size={14} />
      </button>
      {open && (
        <div className="popover__panel profile-menu" role="menu">
          {formats.map((f) => (
            <button key={f} type="button" role="menuitem" className="profile-menu__item" onClick={() => run(f)}>
              {LABELS[f]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ExportButton;
