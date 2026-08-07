import { body, query } from 'express-validator';
import { AUDIT_ACTIONS } from '../utils/enums.js';

export const updateCompanySettingsValidator = [
  body('companyName').optional().trim().isLength({ max: 150 }),
  body('industry').optional().trim().isLength({ max: 100 }),
  body('website').optional({ checkFalsy: true }).trim().isURL().withMessage('Enter a valid URL'),
  body('supportEmail').optional({ checkFalsy: true }).trim().isEmail().withMessage('Enter a valid email'),
  body('phone').optional().trim().isLength({ max: 30 }),
  body('address').optional().trim().isLength({ max: 300 }),
];

export const auditLogQueryValidator = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('action').optional().isIn(AUDIT_ACTIONS),
  query('actor').optional().isMongoId(),
  query('from').optional().isISO8601(),
  query('to').optional().isISO8601(),
];

export const loginHistoryQueryValidator = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('actor').optional().isMongoId(),
  query('from').optional().isISO8601(),
  query('to').optional().isISO8601(),
];
