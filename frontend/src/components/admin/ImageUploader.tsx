import React, { useEffect, useRef, useState } from 'react';
import { ImagePlus, Trash2 } from 'lucide-react';
import clsx from 'clsx';

interface ImageUploaderProps {
  /** Selected file (not yet uploaded). */
  file: File | null;
  onChange: (file: File | null) => void;
  /** Already-saved image URL, shown until a new file is picked. */
  currentUrl?: string;
  /** Called when the saved image is removed. */
  onRemoveCurrent?: () => void;
  maxSizeMB?: number;
  label?: string;
  /** Preview shape: category icons are square, banners are wide. */
  shape?: 'square' | 'wide' | 'circle';
  disabled?: boolean;
}

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  file, onChange, currentUrl, onRemoveCurrent, maxSizeMB = 2, label = 'Upload image', shape = 'square', disabled,
}) => {
  const input = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState('');

  // Object URLs must be revoked or they leak until the tab closes.
  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const pick = (picked?: File) => {
    if (!picked) return;
    if (!ALLOWED.includes(picked.type)) return setError('Use a JPG, PNG or WebP image');
    if (picked.size > maxSizeMB * 1024 * 1024) return setError(`Image must be under ${maxSizeMB} MB`);
    setError('');
    onChange(picked);
  };

  const shown = preview ?? currentUrl ?? null;

  return (
    <div className="hcx-imgup">
      <div className={clsx('hcx-imgup__preview', `hcx-imgup__preview--${shape}`)}>
        {shown ? <img src={shown} alt="Preview" /> : <ImagePlus size={24} aria-hidden />}
      </div>
      <div className="hcx-imgup__side">
        <div className="hcx-imgup__buttons">
          <button type="button" className="hcx-btn" disabled={disabled} onClick={() => input.current?.click()}>
            {shown ? 'Replace' : label}
          </button>
          {shown && (
            <button
              type="button"
              className="hcx-btn hcx-btn--danger-ghost"
              disabled={disabled}
              onClick={() => (file ? onChange(null) : onRemoveCurrent?.())}
            >
              <Trash2 size={14} /> Remove
            </button>
          )}
        </div>
        <small>JPG, PNG or WebP · up to {maxSizeMB} MB</small>
        {error && <small className="hcx-field__error" role="alert">{error}</small>}
        <input
          ref={input}
          type="file"
          hidden
          accept={ALLOWED.join(',')}
          onChange={(e) => {
            pick(e.target.files?.[0]);
            e.target.value = '';
          }}
        />
      </div>
    </div>
  );
};

export default ImageUploader;
