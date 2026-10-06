/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** "false" switches pricing/coupons from services/pricing.mock.ts to the real endpoints. */
  readonly VITE_MOCK_PRICING?: string;
  /** Google Maps key (Maps JavaScript, Geocoding and Places API (New) enabled). */
  readonly VITE_GOOGLE_MAPS_API_KEY?: string;
}