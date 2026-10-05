import { Schema, model, type InferSchemaType } from 'mongoose';
import {
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
  TICKET_STATUSES,
} from '../modules/tickets/tickets.constants';

const TicketSchema = new Schema(
  {
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    createdByRole: { type: String, enum: ['customer', 'partner'], required: true },
    bookingId: { type: Schema.Types.ObjectId, ref: 'Booking', default: null },
    category: { type: String, enum: TICKET_CATEGORIES, required: true },
    subject: { type: String, required: true, trim: true, maxlength: 140 },
    status: { type: String, enum: TICKET_STATUSES, default: 'open', index: true },
    priority: { type: String, enum: TICKET_PRIORITIES, default: 'normal' },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    lastMessageAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

TicketSchema.index({ createdBy: 1, lastMessageAt: -1 });
TicketSchema.index({ status: 1, priority: 1, lastMessageAt: -1 });

export type Ticket = InferSchemaType<typeof TicketSchema>;
export const TicketModel = model('Ticket', TicketSchema);
export default TicketModel;