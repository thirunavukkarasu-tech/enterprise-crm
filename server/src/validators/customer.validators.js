import { body, param, query } from 'express-validator';
import { CUSTOMER_STATUSES } from '../utils/enums.js';

const customerIdParam = param('id').isMongoId().withMessage('Invalid customer id');

export const listCustomersValidator = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('status').optional().isIn(CUSTOMER_STATUSES).withMessage('Invalid status filter'),
  query('sortBy').optional().isIn(['name', 'createdAt', 'company', 'status']).withMessage('Invalid sortBy'),
  query('sortOrder').optional().isIn(['asc', 'desc']).withMessage('sortOrder must be asc or desc'),
];

export const customerIdValidator = [customerIdParam];

export const createCustomerValidator = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 120 }),
  body('email').trim().notEmpty().withMessage('Email is required').isEmail().withMessage('Enter a valid email address'),
  body('phone').optional({ checkFalsy: true }).isLength({ max: 30 }),
  body('company').optional({ checkFalsy: true }).isLength({ max: 120 }),
  body('industry').optional({ checkFalsy: true }).isLength({ max: 80 }),
  body('address').optional({ checkFalsy: true }).isLength({ max: 240 }),
  body('status').optional().isIn(CUSTOMER_STATUSES).withMessage('Invalid status'),
  body('tags').optional().isArray().withMessage('Tags must be an array of strings'),
  body('tags.*').optional().isString().isLength({ max: 30 }),
  body('assignedTo').optional().isMongoId().withMessage('Invalid assignedTo id'),
];

export const updateCustomerValidator = [
  customerIdParam,
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty').isLength({ max: 120 }),
  body('email').optional().trim().isEmail().withMessage('Enter a valid email address'),
  body('phone').optional({ checkFalsy: true }).isLength({ max: 30 }),
  body('company').optional({ checkFalsy: true }).isLength({ max: 120 }),
  body('industry').optional({ checkFalsy: true }).isLength({ max: 80 }),
  body('address').optional({ checkFalsy: true }).isLength({ max: 240 }),
  body('status').optional().isIn(CUSTOMER_STATUSES).withMessage('Invalid status'),
  body('tags').optional().isArray().withMessage('Tags must be an array of strings'),
  body('tags.*').optional().isString().isLength({ max: 30 }),
  body('assignedTo').optional().isMongoId().withMessage('Invalid assignedTo id'),
];

export const addNoteValidator = [
  customerIdParam,
  body('text').trim().notEmpty().withMessage('Note text is required').isLength({ max: 2000 }),
];

export const timelineValidator = [
  customerIdParam,
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
];
