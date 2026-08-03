import { body, param, query } from 'express-validator';
import { LEAD_STATUSES, LEAD_SOURCES, LEAD_PRIORITIES } from '../utils/enums.js';

const leadIdParam = param('id').isMongoId().withMessage('Invalid lead id');

export const listLeadsValidator = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('status').optional().isIn(LEAD_STATUSES).withMessage('Invalid status filter'),
  query('source').optional().isIn(LEAD_SOURCES).withMessage('Invalid source filter'),
  query('priority').optional().isIn(LEAD_PRIORITIES).withMessage('Invalid priority filter'),
  query('sortBy')
    .optional()
    .isIn(['name', 'createdAt', 'company', 'status', 'priority', 'estimatedValue'])
    .withMessage('Invalid sortBy'),
  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('sortOrder must be asc or desc'),
];

export const leadIdValidator = [leadIdParam];

const sharedFields = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 120 }),
  body('email').optional({ checkFalsy: true }).isEmail().withMessage('Enter a valid email address'),
  body('phone').optional({ checkFalsy: true }).isLength({ max: 30 }),
  body('company').optional({ checkFalsy: true }).isLength({ max: 120 }),
  body('status').optional().isIn(LEAD_STATUSES).withMessage('Invalid status'),
  body('source').optional().isIn(LEAD_SOURCES).withMessage('Invalid source'),
  body('priority').optional().isIn(LEAD_PRIORITIES).withMessage('Invalid priority'),
  body('estimatedValue').optional().isFloat({ min: 0 }).withMessage('Must be a positive number'),
  body('assignedTo').optional().isMongoId().withMessage('Invalid assignedTo id'),
];

export const createLeadValidator = [...sharedFields];

export const updateLeadValidator = [
  leadIdParam,
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty').isLength({ max: 120 }),
  ...sharedFields.slice(1),
];

export const addNoteValidator = [
  leadIdParam,
  body('text').trim().notEmpty().withMessage('Note text is required').isLength({ max: 2000 }),
];

export const timelineValidator = [
  leadIdParam,
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
];

export const attachmentIdValidator = [
  leadIdParam,
  param('attachmentId').isMongoId().withMessage('Invalid attachment id'),
];
