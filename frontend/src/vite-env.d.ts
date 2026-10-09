/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  /** "false" switches pricing/coupons from services/pricing.mock.ts to the real endpoints. */
  readonly VITE_MOCK_PRICING?: string;
  /** Google Maps key (Maps JavaScript, Geocoding and Places API (New) enabled). */
  readonly VITE_GOOGLE_MAPS_API_KEY?: string;
}

declare module 'jspdf' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export class jsPDF {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(options?: any);
    addFileToVFS(filename: string, filecontent: string): void;
    addFont(filename: string, fontname: string, fontstyle: string): void;
    setFont(fontName: string, fontStyle?: string): void;
    setFontSize(size: number): void;
    setTextColor(r: number, g?: number, b?: number): void;
    setDrawColor(r: number, g?: number, b?: number): void;
    setFillColor(r: number, g?: number, b?: number): void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    text(text: string | string[], x: number, y: number, options?: any): void;
    line(x1: number, y1: number, x2: number, y2: number): void;
    rect(x: number, y: number, w: number, h: number, style?: string): void;
    roundedRect(x: number, y: number, w: number, h: number, rx: number, ry: number, style?: string): void;
    setLineWidth(width: number): void;
    addPage(): void;
    getTextWidth(text: string): number;
    splitTextToSize(text: string, maxW: number): string[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    addImage(imageData: any, format: string, x: number, y: number, width: number, height: number): void;
    save(filename: string): void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    output(type?: string): any;
  }
}