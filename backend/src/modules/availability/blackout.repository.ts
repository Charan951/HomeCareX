import { BlackoutDate } from './blackout.model';
import { CreateBlackoutInput, UpdateBlackoutInput } from './blackout.validation';

export const list = (partnerId: string) => BlackoutDate.find({ partnerId }).sort({ date: 1 });

export const create = (partnerId: string, data: CreateBlackoutInput) =>
  BlackoutDate.create({ partnerId, ...data });

export const update = (partnerId: string, id: string, data: UpdateBlackoutInput) =>
  BlackoutDate.findOneAndUpdate({ _id: id, partnerId }, { $set: data }, { new: true, runValidators: true });

export const remove = (partnerId: string, id: string) =>
  BlackoutDate.findOneAndDelete({ _id: id, partnerId });

export const existOnDate = (partnerId: string, date: string) => 
    BlackoutDate.exists({ partnerId, date });

export const listInRange = (partnerId: string, from: string, to: string) =>
  BlackoutDate.find({ partnerId, date: { $gte: from, $lte: to } }).sort({ date: 1 });