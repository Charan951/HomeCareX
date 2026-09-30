import { Availability } from './availability.model';
import * as blackoutRepo from './blackout.repository';


const todayStr = () => new Date().toISOString().slice(0, 10);

const addDays = (dateStr: string, days: number): string => {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

export const getSchedule = async (partnerId: string, from?: string, to?: string) => {
  const rangeFrom = from ?? todayStr();
  const rangeTo = to ?? addDays(rangeFrom, 30);

  const availability = await Availability.findOne({ partnerId });
  const blackoutDates = await blackoutRepo.listInRange(partnerId, rangeFrom, rangeTo);

  return {
    range: { from: rangeFrom, to: rangeTo },
    isOnline: availability?.isOnline ?? false,
    workingHours: availability?.workingHours ?? [],
    blackoutDates: blackoutDates.map((b) => ({ id: b._id, date: b.date, reason: b.reason })),
    // MOCK: Bookings model doesn't exist yet. Replace with real jobs once it does.
    jobs: [] as { id: string; date: string; start: string; end: string; title: string }[],
  };
};