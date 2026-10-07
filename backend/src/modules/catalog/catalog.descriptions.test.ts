import assert from 'node:assert/strict';
import { test } from 'node:test';
import { SERVICE_DESCRIPTIONS } from './catalog.descriptionsSeedData';
import { CATALOG_SEED_SERVICES } from './catalog.seedData';

test('every launch service has a full description that is longer than its one-line seed', () => {
  for (const sv of CATALOG_SEED_SERVICES) {
    const full = SERVICE_DESCRIPTIONS[sv.slug];
    assert.ok(full, `missing description for ${sv.slug}`);
    assert.ok(full.length > sv.description.length, `${sv.slug}: not longer than the one-liner`);
    assert.ok(full.length >= 120 && full.length <= 500, `${sv.slug}: ${full.length} chars, expected 120-500`);
    assert.equal(full, full.trim());
  }
});

test('no description for an unknown slug', () => {
  const slugs = new Set(CATALOG_SEED_SERVICES.map((s) => s.slug));
  for (const slug of Object.keys(SERVICE_DESCRIPTIONS)) assert.ok(slugs.has(slug), `unknown slug ${slug}`);
});
