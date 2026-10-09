import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useOverlay } from '@/hooks/useOverlay';
import './CategoryFilterMenu.css';

export interface CategoryFilterOption { id: string; name: string; count: number }

interface Props {
  options: CategoryFilterOption[];
  /** Selected category id, '' = all. */
  value: string;
  onChange: (id: string) => void;
  /** Services currently shown, used in the "Show N services" button. */
  total?: number;
}

/** Three sliders, same icon as the Customers page filter. */
const FilterIcon: React.FC<{ size?: number }> = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
    <path d="M3 6h10.5M20.5 6H21" />
    <circle cx="17" cy="6" r="2.6" />
    <path d="M3 12h2.5M10.5 12H21" />
    <circle cx="8" cy="12" r="2.6" />
    <path d="M3 18h7.5M17.5 18H21" />
    <circle cx="14" cy="18" r="2.6" />
  </svg>
);

const Chip: React.FC<{ selected: boolean; onClick: () => void; children: React.ReactNode }> = ({ selected, onClick, children }) => (
  <button type="button" className={`cfm-chip${selected ? ' is-selected' : ''}`} aria-pressed={selected} onClick={onClick}>{children}</button>
);

/**
 * Filter icon for the Services page, styled like the Customers page filter:
 * opens a "Filters" sheet (bottom sheet on phones, right-hand panel on desktop) with category chips.
 */
export const CategoryFilterMenu: React.FC<Props> = ({ options, value, onChange, total }) => {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  const panelRef = useOverlay<HTMLDivElement>(open, close);
  const applied = value ? 1 : 0;
  const subtitle = applied === 0 ? 'No filters applied' : '1 filter applied';

  return (
    <div className="cfm">
      <button
        type="button" className={`cfm__btn${applied ? ' is-active' : ''}`} onClick={() => setOpen(true)}
        aria-label="Filter by category" aria-haspopup="dialog" aria-expanded={open}
      >
        <FilterIcon />
        {applied > 0 && <span className="cfm__dot" aria-hidden />}
      </button>
      {open && createPortal(
        <div className="cfm-overlay" onMouseDown={(e) => e.target === e.currentTarget && close()}>
          <div ref={panelRef} className="cfm-sheet" role="dialog" aria-modal="true" aria-label="Filters" tabIndex={-1}>
            <header className="cfm-sheet__head">
              <div>
                <h2 className="cfm-sheet__title">Filters</h2>
                <p className="cfm-sheet__sub" aria-live="polite">{subtitle}</p>
              </div>
              <div className="cfm-sheet__head-actions">
                {applied > 0 && <button type="button" className="cfm-sheet__clear" onClick={() => onChange('')}>Clear all</button>}
                <button type="button" className="cfm-sheet__close" onClick={close} aria-label="Close filters"><X size={20} aria-hidden /></button>
              </div>
            </header>
            <div className="cfm-sheet__body">
              <section aria-labelledby="cfm-f-cat">
                <h3 id="cfm-f-cat" className="cfm-sheet__label">Category</h3>
                <div className="cfm-sheet__chips">
                  <Chip selected={!value} onClick={() => onChange('')}>All categories</Chip>
                  {options.map((o) => <Chip key={o.id} selected={o.id === value} onClick={() => onChange(o.id)}>{o.name} ({o.count})</Chip>)}
                </div>
              </section>
            </div>
            <footer className="cfm-sheet__foot">
              <button type="button" className="cfm-sheet__cta" onClick={close}>
                {total === undefined ? 'Show services' : `Show ${total} ${total === 1 ? 'service' : 'services'}`}
              </button>
            </footer>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
};

export default CategoryFilterMenu;
