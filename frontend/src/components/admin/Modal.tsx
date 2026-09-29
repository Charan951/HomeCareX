import React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import clsx from 'clsx';
import { useOverlay } from '@/hooks/useOverlay';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg';
  /** Buttons row pinned to the bottom. */
  footer?: React.ReactNode;
  /** Set false while a request is running so the dialog can't be dismissed by accident. */
  dismissible?: boolean;
  children?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  open, onClose, title, description, size = 'md', footer, dismissible = true, children,
}) => {
  const panelRef = useOverlay<HTMLDivElement>(open, () => dismissible && onClose());
  if (!open) return null;

  return createPortal(
    <div className="hcx-overlay hcx-overlay--center" onMouseDown={(e) => e.target === e.currentTarget && dismissible && onClose()}>
      <div
        ref={panelRef}
        className={clsx('hcx-modal', `hcx-modal--${size}`)}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
      >
        <header className="hcx-panel__head">
          <div>
            <h2 className="hcx-panel__title">{title}</h2>
            {description && <p className="hcx-panel__desc">{description}</p>}
          </div>
          <button type="button" className="icon-btn" onClick={onClose} disabled={!dismissible} aria-label="Close">
            <X size={18} />
          </button>
        </header>
        <div className="hcx-panel__body">{children}</div>
        {footer && <footer className="hcx-panel__foot">{footer}</footer>}
      </div>
    </div>,
    document.body,
  );
};

export default Modal;
