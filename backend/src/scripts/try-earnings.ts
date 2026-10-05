import 'dotenv/config';
import mongoose, { Types } from 'mongoose';
import EarningModel from '../modules/earnings/Earning';
import { registerEarningsListeners } from '../modules/earnings/earnings.listener';
import { emitJobCompleted } from '../modules/events/eventBus';
import TicketModel from '../models/Ticket';
import TicketMessageModel from '../modules/tickets/TicketMessage';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  await mongoose.connect(process.env.DATABASE_URL as string);
  await EarningModel.init(); // make sure the unique bookingId index exists

  // 1. Ticket + TicketMessage contract
  const userId = new Types.ObjectId();
  const ticket = await TicketModel.create({
    createdBy: userId, createdByRole: 'partner', category: 'payment', subject: 'Contract test',
  });
  const msg = await TicketMessageModel.create({
    ticketId: ticket._id, senderId: userId, senderRole: 'partner', body: 'hello',
  });
  console.log('TICKET status/priority:', ticket.status, ticket.priority, '| MESSAGE:', msg.body);
  await TicketMessageModel.deleteOne({ _id: msg._id });
  await TicketModel.deleteOne({ _id: ticket._id });

  // 2. Earning model + idempotent listener: same event sent twice
  registerEarningsListeners();
  const bookingId = new Types.ObjectId().toString();
  const partnerId = process.argv[2] ?? new Types.ObjectId().toString();
  const payload = { bookingId, partnerId, gross: 1000, completedAt: new Date() };
  emitJobCompleted(payload);
  emitJobCompleted(payload);
  await sleep(1500);
  const rows = await EarningModel.find({ bookingId });
  console.log('EARNING rows (expect 1):', rows.length, rows[0]?.toObject());
  if (!process.argv[2]) await EarningModel.deleteMany({ bookingId });

  await mongoose.disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });