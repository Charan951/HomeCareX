export const NOTIFICATION_TYPES = [
  'booking.created',
  'booking.assigned',
  'booking.cancelled',
  'booking.completed',
  'partner.approved',
  'partner.rejected',
  'payout.processed',
  'refund.updated',
  'ticket.reply',
  'system.announcement',
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

/** Socket.IO event the clients listen for. */
export const NOTIFICATION_SOCKET_EVENT = 'notification:new';

export const NOTIFICATIONS_CONSTANTS = { NOTIFICATION_TYPES, NOTIFICATION_SOCKET_EVENT };
