/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  /** "false" switches pricing/coupons from services/pricing.mock.ts to the real endpoints. */
  readonly VITE_MOCK_PRICING?: string;
}