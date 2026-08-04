import { body, param, query } from 'express-validator';
import { TASK_STATUSES, TASK_PRIORITIES, TASK_CATEGORIES } from '../utils/enums.js';

const taskIdParam = param('id').isMongoId().withMessage('Invalid task id');

export const listTasksValidator = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('status').optional().isIn(TASK_STATUSES).withMessage('Invalid status filter'),
  query('priority').optional().isIn(TASK_PRIORITIES).withMessage('Invalid priority filter'),
  query('category').optional().isIn(TASK_CATEGORIES).withMessage('Invalid category filter'),
  query('relatedCustomer').optional().isMongoId(),
  query('relatedLead').optional().isMongoId(),
  query('sortBy')
    .optional()
    .isIn(['title', 'dueDate', 'priority', 'status', 'createdAt'])
    .withMessage('Invalid sortBy'),
  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('sortOrder must be asc or desc'),
];

export const taskIdValidator = [taskIdParam];

const sharedFields = [
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 150 }),
  body('description').optional({ checkFalsy: true }).isLength({ max: 1000 }),
  body('dueDate').notEmpty().withMessage('Due date is required').isISO8601().withMessage('Invalid due date'),
  body('priority').optional().isIn(TASK_PRIORITIES).withMessage('Invalid priority'),
  body('status').optional().isIn(TASK_STATUSES).withMessage('Invalid status'),
  body('category').optional().isIn(TASK_CATEGORIES).withMessage('Invalid category'),
  body('assignedTo').optional().isMongoId().withMessage('Invalid assignedTo id'),
  body('relatedCustomer').optional({ checkFalsy: true }).isMongoId(),
  body('relatedLead').optional({ checkFalsy: true }).isMongoId(),
  body('reminderAt').optional({ checkFalsy: true }).isISO8601().withMessage('Invalid reminder date'),
];

export const createTaskValidator = [...sharedFields];

export const updateTaskValidator = [
  taskIdParam,
  body('title').optional().trim().notEmpty().withMessage('Title cannot be empty').isLength({ max: 150 }),
  body('description').optional({ checkFalsy: true }).isLength({ max: 1000 }),
  body('dueDate').optional().isISO8601().withMessage('Invalid due date'),
  body('priority').optional().isIn(TASK_PRIORITIES).withMessage('Invalid priority'),
  body('status').optional().isIn(TASK_STATUSES).withMessage('Invalid status'),
  body('category').optional().isIn(TASK_CATEGORIES).withMessage('Invalid category'),
  body('assignedTo').optional().isMongoId().withMessage('Invalid assignedTo id'),
  body('relatedCustomer').optional({ checkFalsy: true }).isMongoId(),
  body('relatedLead').optional({ checkFalsy: true }).isMongoId(),
  body('reminderAt').optional({ checkFalsy: true }).isISO8601().withMessage('Invalid reminder date'),
];

export const addCommentValidator = [
  taskIdParam,
  body('text').trim().notEmpty().withMessage('Comment text is required').isLength({ max: 2000 }),
];

export const timelineValidator = [taskIdParam, query('limit').optional().isInt({ min: 1, max: 100 }).toInt()];

export const attachmentIdValidator = [
  taskIdParam,
  param('attachmentId').isMongoId().withMessage('Invalid attachment id'),
];
