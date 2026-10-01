import { domainToASCII } from 'node:url';

const LOCAL_PART_PATTERN = /^[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+)*$/;
const DOMAIN_CHARACTERS_PATTERN = /^[\p{L}\p{N}.-]+$/u;
const DOMAIN_LABEL_PATTERN = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;
const ASCII_TOP_LEVEL_DOMAIN_PATTERN = /^[a-z]{2,63}$/;
const INTERNATIONAL_TOP_LEVEL_DOMAIN_PATTERN = /^xn--[a-z0-9-]*[a-z0-9]$/;

const toAsciiDomain = (domain: string): string | null => {
  if (!DOMAIN_CHARACTERS_PATTERN.test(domain)) return null;
  const asciiDomain = domainToASCII(domain).toLowerCase();
  return asciiDomain || null;
};

export const normalizeLeadEmail = (value: string): string => {
  const trimmed = value.trim();
  const separator = trimmed.indexOf('@');
  if (separator < 0 || separator !== trimmed.lastIndexOf('@')) return trimmed;
  const localPart = trimmed.slice(0, separator);
  const domain = toAsciiDomain(trimmed.slice(separator + 1));
  return domain ? `${localPart.toLowerCase()}@${domain}` : trimmed;
};

export const isValidLeadEmail = (value: string): boolean => {
  const normalized = normalizeLeadEmail(value);
  if (normalized.length > 254) return false;

  const separator = normalized.indexOf('@');
  if (separator < 1 || separator !== normalized.lastIndexOf('@')) return false;

  const localPart = normalized.slice(0, separator);
  const domain = normalized.slice(separator + 1);
  if (localPart.length > 64 || !LOCAL_PART_PATTERN.test(localPart)) return false;
  if (domain.length > 253 || domain.startsWith('.') || domain.endsWith('.')) return false;

  const labels = domain.split('.');
  if (labels.length < 2 || labels.some((label) => label.length === 0 || label.length > 63 || !DOMAIN_LABEL_PATTERN.test(label))) {
    return false;
  }

  const topLevelDomain = labels[labels.length - 1];
  return ASCII_TOP_LEVEL_DOMAIN_PATTERN.test(topLevelDomain)
    || INTERNATIONAL_TOP_LEVEL_DOMAIN_PATTERN.test(topLevelDomain);
};

export const isGmailLeadEmail = (value: string): boolean => {
  const normalized = normalizeLeadEmail(value);
  const separator = normalized.lastIndexOf('@');
  return separator > 0 && normalized.slice(separator + 1) === 'gmail.com';
};
