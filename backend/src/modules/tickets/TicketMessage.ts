import { Schema, model, type InferSchemaType } from 'mongoose';
import { TICKET_SENDER_ROLES } from './tickets.constants';

const AttachmentSchema = new Schema(
  {
    url: { type: String, required: true },
    name: { type: String, required: true },
    mimeType: { type: String, required: true },
    sizeBytes: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const TicketMessageSchema = new Schema(
  {
    ticketId: { type: Schema.Types.ObjectId, ref: 'Ticket', required: true, index: true },
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    senderRole: { type: String, enum: TICKET_SENDER_ROLES, required: true },
    body: { type: String, required: true, trim: true, maxlength: 4000 },
    attachments: { type: [AttachmentSchema], default: [] },
    readAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

TicketMessageSchema.index({ ticketId: 1, createdAt: 1 });

export type TicketMessage = InferSchemaType<typeof TicketMessageSchema>;
export const TicketMessageModel = model('TicketMessage', TicketMessageSchema);
export default TicketMessageModel;