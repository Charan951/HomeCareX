import React, { useState } from 'react';
import { Download, ExternalLink, FileQuestion } from 'lucide-react';

interface DocumentViewerProps {
  url: string;
  name: string;
  /** MIME type if known; otherwise guessed from the file extension. */
  mimeType?: string;
  height?: number;
}

function kindOf(url: string, mimeType?: string): 'image' | 'pdf' | 'other' {
  const hint = (mimeType ?? url.split('?')[0]).toLowerCase();
  if (hint.startsWith('image/') || /\.(png|jpe?g|webp|gif)$/.test(hint)) return 'image';
  if (hint === 'application/pdf' || hint.endsWith('.pdf')) return 'pdf';
  return 'other';
}

/** Inline preview for KYC and invoice documents (images and PDFs), with open/download fallbacks. */
export const DocumentViewer: React.FC<DocumentViewerProps> = ({ url, name, mimeType, height = 480 }) => {
  const kind = kindOf(url, mimeType);
  const [failed, setFailed] = useState(false);

  return (
    <div className="hcx-docviewer">
      <div className="hcx-docviewer__bar">
        <span className="hcx-docviewer__name" title={name}>{name}</span>
        <a className="icon-btn" href={url} target="_blank" rel="noreferrer" aria-label="Open in new tab">
          <ExternalLink size={16} />
        </a>
        <a className="icon-btn" href={url} download={name} aria-label="Download">
          <Download size={16} />
        </a>
      </div>
      <div className="hcx-docviewer__body" style={{ height }}>
        {failed || kind === 'other' ? (
          <div className="hcx-empty">
            <FileQuestion size={28} aria-hidden />
            <p>{failed ? 'This document could not be loaded.' : 'Preview is not available for this file type.'}</p>
          </div>
        ) : kind === 'image' ? (
          <img src={url} alt={name} onError={() => setFailed(true)} />
        ) : (
          <iframe src={url} title={name} onError={() => setFailed(true)} />
        )}
      </div>
    </div>
  );
};

export default DocumentViewer;
