import { Schema, model } from 'mongoose';

const TicketSchema = new Schema({}, { timestamps: true });

export const TicketModel = model('Ticket', TicketSchema);
export default TicketModel;
