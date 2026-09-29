/**
 * Access token lives in memory only (never localStorage). The refresh token is an
 * httpOnly cookie the browser sends to /api/v1/auth, so a page reload restores the
 * session through POST /auth/refresh.
 */
let accessToken: string | null = null;

export const tokenStore = {
  get: () => accessToken,
  set: (token: string | null) => {
    accessToken = token;
  },
};

/** Fired when refresh fails; AuthProvider listens and signs the user out. */
export const SESSION_EXPIRED_EVENT = "auth:session-expired";
