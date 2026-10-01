import { NotificationModel } from '../../models/Notification';
import { emitToUser } from '../../sockets';
import { NOTIFICATION_SOCKET_EVENT, type NotificationType } from './notifications.constants';

export interface NotificationDto {
  id: string;
  userId: string;
  type: string;
  payload: unknown;
  readAt: Date | null;
  createdAt: Date;
}

function toDto(n: InstanceType<typeof NotificationModel>): NotificationDto {
  return {
    id: n.id,
    userId: String(n.userId),
    type: n.type,
    payload: n.payload,
    readAt: n.readAt ?? null,
    createdAt: (n as unknown as { createdAt: Date }).createdAt,
  };
}

/**
 * Contract used by every module: notify(userId, type, payload).
 * Saves the notification, then pushes it to the user's socket room.
 * A socket failure (server not up yet, user offline) never fails the caller: the row is already saved.
 */
export async function notify(userId: string, type: NotificationType, payload: Record<string, unknown> = {}): Promise<NotificationDto> {
  const doc = await NotificationModel.create({ userId, type, payload });
  const dto = toDto(doc);
  try {
    emitToUser(userId, NOTIFICATION_SOCKET_EVENT, dto);
  } catch {
    /* sockets not initialised (scripts/tests) */
  }
  return dto;
}

export class NotificationsService {
  notify = notify;

  async listForUser(userId: string, limit = 30) {
    const rows = await NotificationModel.find({ userId }).sort({ createdAt: -1 }).limit(limit);
    return rows.map(toDto);
  }

  unreadCount(userId: string) {
    return NotificationModel.countDocuments({ userId, readAt: null });
  }

  async markRead(userId: string, id: string) {
    await NotificationModel.updateOne({ _id: id, userId, readAt: null }, { $set: { readAt: new Date() } });
  }

  async markAllRead(userId: string) {
    await NotificationModel.updateMany({ userId, readAt: null }, { $set: { readAt: new Date() } });
  }
}

export const notificationsService = new NotificationsService();
