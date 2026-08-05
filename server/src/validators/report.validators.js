import { query } from 'express-validator';

export const reportQueryValidator = [
  query('from').optional().isISO8601().withMessage('Invalid "from" date'),
  query('to').optional().isISO8601().withMessage('Invalid "to" date'),
  query('groupBy').optional().isIn(['month', 'year']).withMessage('groupBy must be "month" or "year"'),
];

export const exportQueryValidator = [
  query('type').isIn(['sales', 'customers', 'leads', 'tasks']).withMessage('Invalid report type'),
  query('format').isIn(['csv', 'xlsx']).withMessage('format must be "csv" or "xlsx"'),
  query('from').optional().isISO8601().withMessage('Invalid "from" date'),
  query('to').optional().isISO8601().withMessage('Invalid "to" date'),
];
