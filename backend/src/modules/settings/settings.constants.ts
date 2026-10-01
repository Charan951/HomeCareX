/**
 * Settings contract. Every key the platform reads lives here with its default,
 * so getSetting() always has an answer even before the DB is seeded.
 */
export const SETTING_DEFAULTS = {
  /** GST charged on the service total, in percent. */
  'tax.gstPercent': { value: 18, description: 'GST percentage applied to bookings' },
  /** Platform commission taken from each completed job, in percent. */
  'commission.percent': { value: 20, description: 'Platform commission percentage on completed jobs' },
  /** Customer can cancel for free until this many hours before the slot. */
  'cancellation.windowHours': { value: 4, description: 'Free-cancellation window (hours before slot)' },
  /** Flat fee (INR) charged for cancellations inside the window. */
  'cancellation.feeAmount': { value: 99, description: 'Cancellation fee in INR inside the window' },
  /** Max bookings that can share one time slot for a service. */
  'slots.capacityPerSlot': { value: 5, description: 'Maximum bookings per time slot' },
  /** Pincodes where bookings are accepted (Hyderabad defaults). */
  'serviceability.pincodes': {
    value: [
      '500001', '500003', '500004', '500008', '500016', '500018', '500032', '500033',
      '500034', '500081', '500082', '500084', '500089', '500090',
    ] as string[],
    description: 'Serviceable pincodes',
  },
} as const;

export type SettingKey = keyof typeof SETTING_DEFAULTS;
export const SETTING_KEYS = Object.keys(SETTING_DEFAULTS) as SettingKey[];

/** Value type per key, so getSetting('tax.gstPercent') is typed as number. */
export type SettingValue<K extends SettingKey> = (typeof SETTING_DEFAULTS)[K]['value'];
