import { Schema, model, type InferSchemaType } from 'mongoose';

/** In-app notification for one user. Created by notify(); delivered live over Socket.IO when the user is online. */
const NotificationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    /** Machine-readable kind, e.g. 'booking.assigned'. See NOTIFICATION_TYPES. */
    type: { type: String, required: true, index: true },
    /** Free-form data the client needs to render / deep-link the notification. */
    payload: { type: Schema.Types.Mixed, default: {} },
    readAt: { type: Date, default: null },
  },
  { timestamps: true },
);

NotificationSchema.index({ userId: 1, readAt: 1, createdAt: -1 });

export type Notification = InferSchemaType<typeof NotificationSchema>;
export const NotificationModel = model('Notification', NotificationSchema);
export default NotificationModel;
