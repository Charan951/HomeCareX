import React, { useState } from "react";

interface DocumentViewerProps {
  url: string;
  name: string;
  mimeType?: string;
  height?: number;
}

type DocumentKind =
  | "image"
  | "pdf"
  | "other";

function getDocumentKind(
  url: string,
  mimeType?: string
): DocumentKind {
  const hint = (
    mimeType ?? url.split("?")[0]
  ).toLowerCase();

  if (
    hint.startsWith("image/") ||
    /\.(png|jpe?g|webp|gif)$/.test(hint)
  ) {
    return "image";
  }

  if (
    hint === "application/pdf" ||
    hint.endsWith(".pdf")
  ) {
    return "pdf";
  }

  return "other";
}

const DocumentViewer: React.FC<
  DocumentViewerProps
> = ({
  url,
  name,
  mimeType,
  height = 480,
}) => {
  const kind = getDocumentKind(url, mimeType);

  const [failed, setFailed] =
    useState(false);

  const [zoom, setZoom] =
    useState(1);

  const zoomIn = () => {
    setZoom((current) =>
      Math.min(current + 0.1, 2)
    );
  };

  const zoomOut = () => {
    setZoom((current) =>
      Math.max(current - 0.1, 0.5)
    );
  };

  const resetZoom = () => {
    setZoom(1);
  };

  return (
    <section
      className="hcx-docviewer"
      aria-label={`${name} document viewer`}
    >
      <div className="hcx-docviewer__bar">
        <span
          className="hcx-docviewer__name"
          title={name}
        >
          {name}
        </span>

        {kind === "image" && (
          <div className="hcx-docviewer__zoom">
            <button
              type="button"
              className="icon-btn"
              onClick={zoomOut}
              aria-label="Zoom out"
              disabled={zoom <= 0.5}
            >
              −
            </button>

            <span>
              {Math.round(zoom * 100)}%
            </span>

            <button
              type="button"
              className="icon-btn"
              onClick={zoomIn}
              aria-label="Zoom in"
              disabled={zoom >= 2}
            >
              +
            </button>

            <button
              type="button"
              className="icon-btn"
              onClick={resetZoom}
            >
              Reset
            </button>
          </div>
        )}

        <a
          className="doc-action-btn"
          href={url}
          target="_blank"
          rel="noreferrer"
        >
          Open
        </a>

        <a
          className="doc-action-btn"
          href={url}
          download={name}
        >
          Download
        </a>
      </div>

      <div
        className="hcx-docviewer__body"
        style={{ height }}
      >
        {failed || kind === "other" ? (
          <div className="hcx-docviewer-empty">
            <strong>
              Preview unavailable
            </strong>

            <p>
              This document cannot be previewed
              in the browser.
            </p>

            <a
              href={url}
              target="_blank"
              rel="noreferrer"
            >
              Open document
            </a>
          </div>
        ) : kind === "image" ? (
          <div className="hcx-docviewer-image-container">
            <img
              src={url}
              alt={name}
              className="hcx-docviewer-image"
              style={{
                transform: `scale(${zoom})`,
              }}
              onError={() =>
                setFailed(true)
              }
            />
          </div>
        ) : (
          <iframe
            src={url}
            title={name}
            className="hcx-docviewer-pdf"
            onError={() =>
              setFailed(true)
            }
          />
        )}
      </div>
    </section>
  );
};

export default DocumentViewer;