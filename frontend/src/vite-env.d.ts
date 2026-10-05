/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** "false" switches pricing/coupons from services/pricing.mock.ts to the real endpoints. */
  readonly VITE_MOCK_PRICING?: string;
}