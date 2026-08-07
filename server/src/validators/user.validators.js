import { body, param, query } from 'express-validator';
import { ALL_ROLES } from '../utils/roles.js';

export const updateProfileValidator = [
  body('name').optional().trim().notEmpty().withMessage('Name cannot be empty').isLength({ max: 80 }),
  body('phone').optional().trim().isLength({ max: 30 }),
  body('jobTitle').optional().trim().isLength({ max: 100 }),
];

export const updatePreferencesValidator = [
  body('theme').optional().isIn(['light', 'dark', 'system']).withMessage('Invalid theme'),
  body('emailNotifications').optional().isObject(),
  body('emailNotifications.taskReminders').optional().isBoolean(),
  body('emailNotifications.leadUpdates').optional().isBoolean(),
  body('emailNotifications.weeklyDigest').optional().isBoolean(),
];

export const changePasswordValidator = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .notEmpty()
    .withMessage('New password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/\d/)
    .withMessage('Password must contain at least one number'),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.newPassword) throw new Error('Passwords do not match');
    return true;
  }),
];

export const listUsersValidator = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('role').optional().isIn(ALL_ROLES),
  query('isActive').optional().isBoolean(),
];

export const userIdParamValidator = [param('id').isMongoId().withMessage('Invalid user id')];

export const createUserValidator = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 80 }),
  body('email').trim().notEmpty().withMessage('Email is required').isEmail().withMessage('Enter a valid email').normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),
  body('role').notEmpty().withMessage('Role is required').isIn(ALL_ROLES).withMessage('Invalid role'),
];

export const updateUserValidator = [
  ...userIdParamValidator,
  body('name').optional().trim().notEmpty().isLength({ max: 80 }),
  body('role').optional().isIn(ALL_ROLES).withMessage('Invalid role'),
  body('isActive').optional().isBoolean(),
];
