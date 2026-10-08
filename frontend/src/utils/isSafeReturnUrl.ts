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

  // Reject protocol-relative URLs.
  if (value.startsWith("//")) {
    return false;
  }

  // Reject backslash-based protocol-relative URL tricks.
  if (value.startsWith("\\") || value.includes("\\\\")) {
    return false;
  }

  // Path-only return URLs are allowed.
  if (value.startsWith("/")) {
    return true;
  }

  // Absolute URLs can only be used when they are same-origin.
  if (typeof window === "undefined") {
    return false;
  }

  try {
    const url = new URL(value);

    const isHttpProtocol =
      url.protocol === "http:" || url.protocol === "https:";

    const isSameOrigin = url.origin === window.location.origin;

    const hasCredentials =
      url.username.length > 0 || url.password.length > 0;

    return isHttpProtocol && isSameOrigin && !hasCredentials;
  } catch {
    return false;
  }
};

export default isSafeReturnUrl;