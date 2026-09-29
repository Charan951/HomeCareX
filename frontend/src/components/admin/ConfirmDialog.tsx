import React, { useEffect, useState } from 'react';
import { AlertTriangle, HelpCircle } from 'lucide-react';
import clsx from 'clsx';
import { Modal } from './Modal';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** `danger` for destructive actions (delete, suspend, reject). */
  tone?: 'primary' | 'danger';
  /** Disables buttons and shows a busy label while the request runs. */
  loading?: boolean;
  /** Ask for a note (refund reason, rejection reason…). It is passed to onConfirm. */
  reason?: { label: string; required?: boolean; placeholder?: string };
  onConfirm: (reason?: string) => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open, title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel', tone = 'primary',
  loading, reason, onConfirm, onCancel,
}) => {
  const [text, setText] = useState('');
  useEffect(() => {
    if (open) setText('');
  }, [open]);

  const blocked = Boolean(reason?.required && !text.trim());

  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      size="sm"
      dismissible={!loading}
      footer={
        <>
          <button type="button" className="hcx-btn" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={clsx('hcx-btn', tone === 'danger' ? 'hcx-btn--danger' : 'hcx-btn--primary')}
            onClick={() => onConfirm(reason ? text.trim() : undefined)}
            disabled={loading || blocked}
          >
            {loading ? 'Working…' : confirmLabel}
          </button>
        </>
      }
    >
      <div className="hcx-confirm">
        <span className={clsx('hcx-confirm__icon', tone === 'danger' && 'is-danger')}>
          {tone === 'danger' ? <AlertTriangle size={20} /> : <HelpCircle size={20} />}
        </span>
        <div className="hcx-confirm__text">
          <div>{message}</div>
          {reason && (
            <label className="hcx-field">
              <span>{reason.label}{reason.required && ' *'}</span>
              <textarea
                rows={3}
                value={text}
                placeholder={reason.placeholder}
                onChange={(e) => setText(e.target.value)}
              />
            </label>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
