import { SettingModel } from '../../models/Settings';
import { Errors } from '../../utils/errors';
import { SETTING_DEFAULTS, SETTING_KEYS, type SettingKey, type SettingValue } from './settings.constants';

const CACHE_TTL_MS = 30_000;
const cache = new Map<string, { value: unknown; at: number }>();

const isKey = (k: string): k is SettingKey => (SETTING_KEYS as string[]).includes(k);

/** Inserts any missing defaults. Never overwrites values an admin already changed. Safe to run on every boot. */
export async function seedDefaultSettings(): Promise<number> {
  const existing = new Set((await SettingModel.find({}, 'key').lean()).map((s) => s.key));
  const missing = SETTING_KEYS.filter((k) => !existing.has(k));
  if (missing.length) {
    await SettingModel.insertMany(
      missing.map((key) => ({ key, value: SETTING_DEFAULTS[key].value, description: SETTING_DEFAULTS[key].description })),
    );
  }
  return missing.length;
}

/** Read one setting. Falls back to the built-in default if the DB has no row (or is unreachable). */
export async function getSetting<K extends SettingKey>(key: K): Promise<SettingValue<K>> {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.value as SettingValue<K>;
  let value: unknown = SETTING_DEFAULTS[key].value;
  try {
    const row = await SettingModel.findOne({ key }).lean();
    if (row) value = row.value;
  } catch {
    /* use default */
  }
  cache.set(key, { value, at: Date.now() });
  return value as SettingValue<K>;
}

/** Validates the new value has the same shape as the default (number / string[] ...). */
function assertShape(key: SettingKey, value: unknown) {
  const def = SETTING_DEFAULTS[key].value as unknown;
  if (Array.isArray(def)) {
    if (!Array.isArray(value) || !value.every((v) => typeof v === 'string' && v.trim())) {
      throw Errors.badRequest(`${key} must be a list of non-empty strings`);
    }
    return;
  }
  if (typeof def === 'number') {
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
      throw Errors.badRequest(`${key} must be a non-negative number`);
    }
    if (key.endsWith('Percent') && value > 100) throw Errors.badRequest(`${key} cannot exceed 100`);
  }
}

export const settingsService = {
  async list() {
    const rows = await SettingModel.find().lean();
    const byKey = new Map(rows.map((r) => [r.key, r]));
    return SETTING_KEYS.map((key) => ({
      key,
      value: byKey.get(key)?.value ?? SETTING_DEFAULTS[key].value,
      description: SETTING_DEFAULTS[key].description,
      updatedAt: byKey.get(key)?.updatedAt,
    }));
  },

  async update(key: string, value: unknown, adminId: string) {
    if (!isKey(key)) throw Errors.badRequest(`Unknown setting: ${key}`);
    assertShape(key, value);
    const normalized = Array.isArray(value) ? [...new Set(value.map((v) => String(v).trim()))] : value;
    await SettingModel.updateOne(
      { key },
      { $set: { value: normalized, description: SETTING_DEFAULTS[key].description, updatedBy: adminId } },
      { upsert: true },
    );
    cache.delete(key);
    return { key, value: normalized };
  },
};
