import { Schema, model } from 'mongoose';

const NotificationSchema = new Schema({}, { timestamps: true });

export const NotificationModel = model('Notification', NotificationSchema);
export default NotificationModel;
