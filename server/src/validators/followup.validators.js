import { body, param, query } from 'express-validator';
import { FOLLOWUP_TYPES, FOLLOWUP_STATUSES } from '../utils/enums.js';

const followUpIdParam = param('id').isMongoId().withMessage('Invalid follow-up id');

export const listFollowUpsValidator = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('type').optional().isIn(FOLLOWUP_TYPES).withMessage('Invalid type filter'),
  query('status').optional().isIn(FOLLOWUP_STATUSES).withMessage('Invalid status filter'),
  query('relatedCustomer').optional().isMongoId(),
  query('sortBy').optional().isIn(['subject', 'scheduledAt', 'status', 'createdAt']).withMessage('Invalid sortBy'),
  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('sortOrder must be asc or desc'),
];

export const followUpIdValidator = [followUpIdParam];

const sharedFields = [
  body('type').isIn(FOLLOWUP_TYPES).withMessage('Type must be call, meeting, or email'),
  body('subject').trim().notEmpty().withMessage('Subject is required').isLength({ max: 150 }),
  body('notes').optional({ checkFalsy: true }).isLength({ max: 2000 }),
  body('scheduledAt')
    .notEmpty()
    .withMessage('Scheduled date/time is required')
    .isISO8601()
    .withMessage('Invalid scheduled date'),
  body('durationMinutes').optional({ checkFalsy: true }).isInt({ min: 0, max: 480 }),
  body('status').optional().isIn(FOLLOWUP_STATUSES).withMessage('Invalid status'),
  body('relatedCustomer').isMongoId().withMessage('A related customer is required'),
  body('relatedLead').optional({ checkFalsy: true }).isMongoId(),
  body('assignedTo').optional().isMongoId().withMessage('Invalid assignedTo id'),
  body('reminderAt').optional({ checkFalsy: true }).isISO8601().withMessage('Invalid reminder date'),
];

export const createFollowUpValidator = [...sharedFields];

export const updateFollowUpValidator = [
  followUpIdParam,
  body('type').optional().isIn(FOLLOWUP_TYPES).withMessage('Type must be call, meeting, or email'),
  body('subject').optional().trim().notEmpty().withMessage('Subject cannot be empty').isLength({ max: 150 }),
  body('notes').optional({ checkFalsy: true }).isLength({ max: 2000 }),
  body('scheduledAt').optional().isISO8601().withMessage('Invalid scheduled date'),
  body('durationMinutes').optional({ checkFalsy: true }).isInt({ min: 0, max: 480 }),
  body('status').optional().isIn(FOLLOWUP_STATUSES).withMessage('Invalid status'),
  body('relatedCustomer').optional().isMongoId(),
  body('relatedLead').optional({ checkFalsy: true }).isMongoId(),
  body('assignedTo').optional().isMongoId().withMessage('Invalid assignedTo id'),
  body('reminderAt').optional({ checkFalsy: true }).isISO8601().withMessage('Invalid reminder date'),
];

export const customerHistoryValidator = [
  param('customerId').isMongoId().withMessage('Invalid customer id'),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
];
