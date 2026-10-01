import { Schema, model, type InferSchemaType } from 'mongoose';

/** An in-app notification for one user. Unread = readAt is null/missing. */
const NotificationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, required: true, trim: true },
    title: { type: String, required: true, trim: true },
    body: { type: String, trim: true },
    readAt: { type: Date, default: null },
  },
  { timestamps: true },
);

NotificationSchema.index({ userId: 1, readAt: 1 });

export type Notification = InferSchemaType<typeof NotificationSchema>;
export const NotificationModel = model('Notification', NotificationSchema);
export default NotificationModel;
