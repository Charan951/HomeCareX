/**
 * The HomeCareX icon (same artwork as components/band/Homecarexmark.tsx) as a standalone SVG string,
 * so the receipt PDF can embed it without shipping the 1.4 MB public/logo.png.
 */
export const RECEIPT_LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 100 100">
<defs><linearGradient id="hcx-orange" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#FFB25E"/><stop offset="100%" stop-color="#FF8A3D"/></linearGradient></defs>
<path d="M18 58 C 16 72, 28 86, 46 87 C 63 88, 78 78, 81 62 C 82.5 54, 76 49, 70 52 C 66 54, 65 58, 60 58 C 55 58, 53 51, 46 52 C 40 53, 39 58, 33 57 C 28 56, 25 51, 20 54 C 18.5 55, 18 56.5, 18 58 Z" fill="url(#hcx-orange)"/>
<path d="M13 54 L48 18 L64 31 L64 18 L76 18 L76 42 L87 51" fill="none" stroke="#4338CA" stroke-width="7.5" stroke-linecap="round" stroke-linejoin="round"/>
<g fill="#4338CA"><rect x="41" y="36" width="9" height="9" rx="1.5"/><rect x="52" y="36" width="9" height="9" rx="1.5"/><rect x="41" y="47" width="9" height="9" rx="1.5"/><rect x="52" y="47" width="9" height="9" rx="1.5"/></g>
</svg>`;

let cached: Promise<string | null> | undefined;

/**
 * Draws the logo into a transparent 256px PNG (data URL) that jsPDF can embed.
 * Resolves null, never throws, when the browser cannot render it: the receipt then simply prints without the icon.
 */
export function loadReceiptLogo(): Promise<string | null> {
  cached ??= new Promise<string | null>((resolve) => {
    try {
      if (typeof document === "undefined") return resolve(null);
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = 256;
          canvas.height = 256;
          const ctx = canvas.getContext("2d");
          if (!ctx) return resolve(null);
          ctx.drawImage(img, 0, 0, 256, 256);
          resolve(canvas.toDataURL("image/png"));
        } catch {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(RECEIPT_LOGO_SVG)}`;
    } catch {
      resolve(null);
    }
  }).then((png) => {
    if (!png) cached = undefined; // do not remember a failure; try again next time
    return png;
  });
  return cached;
}