import { Schema, model } from 'mongoose';

const BookingSchema = new Schema({}, { timestamps: true });

export const BookingModel = model('Booking', BookingSchema);
export default BookingModel;
