/**
 * Checks whether a returnUrl is safe to use for client-side navigation.
 *
 * Allowed:
 * - Same-origin absolute URLs
 * - Path-only URLs such as /customer/book/home-cleaning
 *
 * Rejected:
 * - External URLs
 * - Protocol-relative URLs such as //evil.com
 * - javascript:, data:, etc.
 * - URLs containing username/password credentials
 */
export const isSafeReturnUrl = (returnUrl: string): boolean => {
  if (typeof returnUrl !== "string") {
    return false;
  }

  const value = returnUrl.trim();

  if (!value) {
    return false;
  }

  // Reject backslashes anywhere in the path (e.g. /\evil.com, \evil.com, /\\)
  if (value.includes("\\") || value.includes("\r") || value.includes("\n") || value.includes("\0")) {
    return false;
  }

  // Reject protocol-relative URLs.
  if (value.startsWith("//")) {
    return false;
  }

  // Check scheme-based URLs (javascript:, data:, https:, etc.)
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(value)) {
    if (typeof window === "undefined") {
      return false;
    }

    try {
      const url = new URL(value);
      const isHttpProtocol = url.protocol === "http:" || url.protocol === "https:";
      const isSameOrigin = url.origin === window.location.origin;
      const hasCredentials = url.username.length > 0 || url.password.length > 0;

      return isHttpProtocol && isSameOrigin && !hasCredentials;
    } catch {
      return false;
    }
  }

  // Path-only return URLs are allowed.
  if (value.startsWith("/")) {
    return true;
  }

  return false;
};

export default isSafeReturnUrl;