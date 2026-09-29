import React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import clsx from 'clsx';
import { useOverlay } from '@/hooks/useOverlay';

export interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  side?: 'right' | 'left';
  width?: 'sm' | 'md' | 'lg';
  footer?: React.ReactNode;
  children?: React.ReactNode;
}

/** Slide-over panel for record details, edit forms and audit diffs. Full-width on phones. */
export const Drawer: React.FC<DrawerProps> = ({
  open, onClose, title, subtitle, side = 'right', width = 'md', footer, children,
}) => {
  const panelRef = useOverlay<HTMLDivElement>(open, onClose);
  if (!open) return null;

  return createPortal(
    <div className="hcx-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <aside
        ref={panelRef}
        className={clsx('hcx-drawer', `hcx-drawer--${side}`, `hcx-drawer--${width}`)}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
      >
        <header className="hcx-panel__head">
          <div>
            <h2 className="hcx-panel__title">{title}</h2>
            {subtitle && <p className="hcx-panel__desc">{subtitle}</p>}
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </header>
        <div className="hcx-panel__body">{children}</div>
        {footer && <footer className="hcx-panel__foot">{footer}</footer>}
      </aside>
    </div>,
    document.body,
  );
};

export default Drawer;
