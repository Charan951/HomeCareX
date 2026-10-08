import React from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft } from 'lucide-react';
import { useOverlay } from '@/hooks/useOverlay';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useUIStore } from '@/store/useUIStore';
import './FullScreenPanel.css';

export interface FullScreenPanelProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  /** Sticky bar at the bottom (Cancel / Save buttons). */
  footer?: React.ReactNode;
  children?: React.ReactNode;
}

/**
 * Full-screen page-style overlay for create / edit / preview / audit screens.
 * Same behaviour as Drawer (Esc closes, scroll lock, focus trap) but fills the whole content area,
 * leaving the admin sidebar visible on desktop.
 */
export const FullScreenPanel: React.FC<FullScreenPanelProps> = ({ open, onClose, title, subtitle, footer, children }) => {
  const panelRef = useOverlay<HTMLDivElement>(open, onClose);
  // Leave the admin sidebar visible on desktop (260px, or 68px when collapsed). On mobile the sidebar is off-canvas.
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const collapsed = useUIStore((s) => s.isSidebarCollapsed);
  const left = isDesktop ? (collapsed ? 68 : 260) : 0;
  if (!open) return null;

  return createPortal(
    <div className="hcx-fs" style={{ left }} ref={panelRef} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1}>
      <header className="hcx-fs__head">
        <button type="button" className="hcx-fs__back" onClick={onClose} title="Back (Esc)">
          <ArrowLeft size={18} aria-hidden /> <span>Back</span>
        </button>
        <div className="hcx-fs__titles">
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
      </header>
      <div className="hcx-fs__body">
        <div className="hcx-fs__inner">{children}</div>
      </div>
      {footer && (
        <footer className="hcx-fs__foot">
          <div className="hcx-fs__foot-inner">{footer}</div>
        </footer>
      )}
    </div>,
    document.body,
  );
};

export default FullScreenPanel;
