import type { TicketCategory, TicketPriority, TicketSenderRole, TicketStatus } from './tickets.constants';

/** API shape of a Ticket. All ids are strings, all dates ISO-8601. */
export interface TicketDto {
  id: string;
  /** User._id of whoever raised it. */
  createdBy: string;
  createdByRole: Exclude<TicketSenderRole, 'admin'>;
  /** Optional link to the booking the ticket is about. */
  bookingId: string | null;
  category: TicketCategory;
  subject: string;
  status: TicketStatus;
  priority: TicketPriority;
  /** Admin User._id handling it, if assigned. */
  assignedTo: string | null;
  lastMessageAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface TicketAttachmentDto {
  url: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
}

/** API shape of one message inside a ticket thread. */
export interface TicketMessageDto {
  id: string;
  ticketId: string;
  senderId: string;
  senderRole: TicketSenderRole;
  body: string;
  attachments: TicketAttachmentDto[];
  readAt: string | null;
  createdAt: string;
}

export interface CreateTicketInput {
  category: TicketCategory;
  subject: string;
  body: string;
  bookingId?: string;
  priority?: TicketPriority;
}

export interface CreateTicketMessageInput {
  body: string;
  attachments?: TicketAttachmentDto[];
}