export const SESSION_EXPIRED_EVENT = 'session-expired' as const;

export const emitSessionExpired = (): void => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
  }
};
