import { Notification } from '../models/Notification.js';
import { emitToUser } from '../realtime/socket.js';
import { ApiError } from '../utils/ApiError.js';

/**
 * Every notification in the app is created through this one function
 * rather than modules calling `Notification.create()` directly — that
 * guarantees the real-time emit and the DB write can never drift apart
 * (e.g. a future contributor adding a new notification trigger and
 * forgetting the socket emit). Currently called from the reminder sweep
 * (Phase 6) and task/lead reassignment (this phase); any future module
 * that needs to notify a user should call this instead of touching the
 * Notification model directly.
 */
export const notifyUser = async (userId, { type = 'system', title, message }) => {
  const notification = await Notification.create({ user: userId, type, title, message });
  emitToUser(userId, 'notification:new', {
    _id: notification._id,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    isRead: notification.isRead,
    createdAt: notification.createdAt,
  });
  return notification;
};

/** Paginated notification list for the Notification Center — newest first, optionally filtered by category/read state. */
export const listNotifications = async (user, { page = 1, limit = 20, category, isRead }) => {
  const filter = { user: user._id };
  if (category) filter.type = category;
  if (isRead !== undefined) filter.isRead = isRead === 'true' || isRead === true;

  const skip = (page - 1) * limit;
  const [items, total, unreadCount] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Notification.countDocuments(filter),
    Notification.countDocuments({ user: user._id, isRead: false }),
  ]);

  return {
    items,
    unreadCount,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
  };
};

export const markAsRead = async (user, notificationId) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, user: user._id },
    { isRead: true },
    { new: true }
  );
  if (!notification) throw ApiError.notFound('Notification not found');
  return notification;
};

export const markAllAsRead = async (user) => {
  const result = await Notification.updateMany({ user: user._id, isRead: false }, { isRead: true });
  return { updated: result.modifiedCount };
};

export const deleteNotification = async (user, notificationId) => {
  const notification = await Notification.findOneAndDelete({ _id: notificationId, user: user._id });
  if (!notification) throw ApiError.notFound('Notification not found');
};
