import React, { useRef, useState } from 'react';
import { FileText, Trash2, UploadCloud } from 'lucide-react';
import clsx from 'clsx';

interface FileUploaderProps {
  files: File[];
  onChange: (files: File[]) => void;
  /** Input accept string, e.g. "application/pdf,image/*". */
  accept?: string;
  multiple?: boolean;
  maxSizeMB?: number;
  maxFiles?: number;
  label?: string;
  hint?: string;
  disabled?: boolean;
}

const formatSize = (bytes: number) =>
  bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;

// "image/*", ".pdf" and exact mime types.
function matchesAccept(file: File, accept?: string) {
  if (!accept) return true;
  return accept.split(',').map((a) => a.trim().toLowerCase()).some((rule) => {
    if (rule.startsWith('.')) return file.name.toLowerCase().endsWith(rule);
    if (rule.endsWith('/*')) return file.type.toLowerCase().startsWith(rule.slice(0, -1));
    return file.type.toLowerCase() === rule;
  });
}

/** Drag-and-drop / click uploader that validates and collects Files. Sending them is up to the page. */
export const FileUploader: React.FC<FileUploaderProps> = ({
  files, onChange, accept, multiple = true, maxSizeMB = 5, maxFiles = 10,
  label = 'Drop files here or click to browse', hint, disabled,
}) => {
  const input = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const add = (incoming: FileList | File[]) => {
    const problems: string[] = [];
    const accepted: File[] = [];
    for (const file of Array.from(incoming)) {
      if (!matchesAccept(file, accept)) problems.push(`${file.name}: file type not allowed`);
      else if (file.size > maxSizeMB * 1024 * 1024) problems.push(`${file.name}: larger than ${maxSizeMB} MB`);
      else accepted.push(file);
    }
    const merged = multiple ? [...files, ...accepted] : accepted.slice(0, 1);
    if (merged.length > maxFiles) problems.push(`You can upload at most ${maxFiles} files`);
    setErrors(problems);
    onChange(merged.slice(0, maxFiles));
  };

  return (
    <div className="hcx-uploader">
      <div
        className={clsx('hcx-dropzone', dragging && 'is-dragging', disabled && 'is-disabled')}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
        onClick={() => !disabled && input.current?.click()}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && !disabled && (e.preventDefault(), input.current?.click())}
        onDragOver={(e) => { e.preventDefault(); if (!disabled) setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (!disabled) add(e.dataTransfer.files);
        }}
      >
        <UploadCloud size={24} aria-hidden />
        <p>{label}</p>
        <small>{hint ?? `Up to ${maxSizeMB} MB each`}</small>
        <input
          ref={input}
          type="file"
          hidden
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          onChange={(e) => {
            if (e.target.files) add(e.target.files);
            e.target.value = ''; // allow re-selecting the same file
          }}
        />
      </div>

      {errors.length > 0 && (
        <ul className="hcx-uploader__errors" role="alert">
          {errors.map((msg) => <li key={msg}>{msg}</li>)}
        </ul>
      )}

      {files.length > 0 && (
        <ul className="hcx-filelist">
          {files.map((file, i) => (
            <li key={`${file.name}-${i}`}>
              <FileText size={16} aria-hidden />
              <span className="hcx-filelist__name">{file.name}</span>
              <small>{formatSize(file.size)}</small>
              <button
                type="button"
                className="icon-btn"
                aria-label={`Remove ${file.name}`}
                onClick={() => onChange(files.filter((_, idx) => idx !== i))}
              >
                <Trash2 size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default FileUploader;
