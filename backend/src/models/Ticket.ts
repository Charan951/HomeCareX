import { Schema, model } from 'mongoose';

export const TICKET_STATUSES = ['open', 'in_progress', 'resolved', 'closed'] as const;

/** Minimal shape needed by dashboards. The Support module can extend it (messages, assignee, ...). */
const TicketSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking' },
    subject: { type: String, trim: true },
    status: { type: String, enum: TICKET_STATUSES, default: 'open', index: true },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  },
  { timestamps: true },
);

export const TicketModel = model('Ticket', TicketSchema);
export default TicketModel;
