/** Ticket + TicketMessage contract (published by D02 for the Support module). Change only via PR review. */
export const TICKET_STATUSES = ['open', 'in_progress', 'resolved', 'closed'] as const;
export type TicketStatus = (typeof TICKET_STATUSES)[number];

export const TICKET_PRIORITIES = ['low', 'normal', 'high', 'urgent'] as const;
export type TicketPriority = (typeof TICKET_PRIORITIES)[number];

export const TICKET_CATEGORIES = ['payment', 'booking', 'account', 'safety', 'app_issue', 'other'] as const;
export type TicketCategory = (typeof TICKET_CATEGORIES)[number];

export const TICKET_SENDER_ROLES = ['customer', 'partner', 'admin'] as const;
export type TicketSenderRole = (typeof TICKET_SENDER_ROLES)[number];