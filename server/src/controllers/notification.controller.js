import { asyncHandler } from '../middleware/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import * as notificationService from '../services/notification.service.js';

export const listNotifications = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, category, isRead } = req.query;
  const { items, unreadCount, meta } = await notificationService.listNotifications(req.user, {
    page: Number(page),
    limit: Number(limit),
    category,
    isRead,
  });
  new ApiResponse(200, { items, unreadCount }, 'Notifications fetched', meta).send(res);
});

export const markAsRead = asyncHandler(async (req, res) => {
  const notification = await notificationService.markAsRead(req.user, req.params.id);
  new ApiResponse(200, notification, 'Notification marked as read').send(res);
});

export const markAllAsRead = asyncHandler(async (req, res) => {
  const result = await notificationService.markAllAsRead(req.user);
  new ApiResponse(200, result, 'All notifications marked as read').send(res);
});

export const deleteNotification = asyncHandler(async (req, res) => {
  await notificationService.deleteNotification(req.user, req.params.id);
  new ApiResponse(200, null, 'Notification deleted').send(res);
});
