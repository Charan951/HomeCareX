/** URL-safe slug: lowercase a-z, 0-9 and single hyphens; max 80 chars. */
export const slugify = (value: string): string =>
  value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/g, '');

export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function slugError(slug: string): string {
  if (!slug) return 'Slug is required';
  if (slug.length < 2) return 'Slug must be at least 2 characters';
  if (slug.length > 80) return 'Slug must be 80 characters or fewer';
  if (!SLUG_RE.test(slug)) return 'Use lowercase letters, numbers and single hyphens only';
  return '';
}
