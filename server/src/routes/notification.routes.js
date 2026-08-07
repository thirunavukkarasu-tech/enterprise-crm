import { Router } from 'express';
import { query, param } from 'express-validator';
import * as notificationController from '../controllers/notification.controller.js';
import { validate } from '../middleware/validate.js';
import { protect } from '../middleware/auth.js';

const router = Router();

router.use(protect);

router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('category')
      .optional()
      .isIn(['task', 'lead', 'opportunity', 'followup', 'security', 'admin', 'system']),
    query('isRead').optional().isBoolean(),
  ],
  validate,
  notificationController.listNotifications
);

router.patch('/read-all', notificationController.markAllAsRead);
router.patch('/:id/read', [param('id').isMongoId()], validate, notificationController.markAsRead);
router.delete('/:id', [param('id').isMongoId()], validate, notificationController.deleteNotification);

export default router;
