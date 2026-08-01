import { validationResult } from 'express-validator';
import { ApiError } from '../utils/ApiError.js';

/**
 * Runs after a route's express-validator chain(s). Collects all field
 * errors into a single, consistent 400 response instead of letting each
 * controller re-implement `validationResult(req)` handling.
 */
export const validate = (req, res, next) => {
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  const errors = result.array().map((err) => ({
    field: err.path,
    message: err.msg,
  }));

  throw ApiError.badRequest('Validation failed', errors);
};
