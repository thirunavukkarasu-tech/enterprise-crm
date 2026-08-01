import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

/**
 * Normalizes well-known error types (Mongoose CastError/ValidationError,
 * duplicate-key errors, JWT errors) into ApiError before falling through
 * to the generic handler, so the client always receives the same
 * { success, message, errors } shape regardless of where the error
 * originated.
 */
const normalizeError = (err) => {
  if (err instanceof ApiError) return err;

  // Invalid ObjectId passed to a query
  if (err.name === 'CastError') {
    return ApiError.badRequest(`Invalid value for field "${err.path}"`);
  }

  // Mongoose schema validation failure
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e) => e.message);
    return ApiError.badRequest('Validation failed', errors);
  }

  // Duplicate unique index (e.g. email already registered)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return ApiError.conflict(`${field} already exists`);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return ApiError.unauthorized('Invalid authentication token');
  }
  if (err.name === 'TokenExpiredError') {
    return ApiError.unauthorized('Authentication token has expired');
  }

  return new ApiError(err.statusCode || 500, err.message || 'Internal server error');
};

// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  const normalized = normalizeError(err);

  if (!normalized.isOperational || normalized.statusCode >= 500) {
    // eslint-disable-next-line no-console
    console.error(`[error] ${req.method} ${req.originalUrl} —`, err);
  }

  res.status(normalized.statusCode).json({
    success: false,
    message: normalized.message,
    errors: normalized.errors || [],
    ...(env.isProd ? {} : { stack: err.stack }),
  });
};

export const notFoundHandler = (req, res, next) => {
  next(ApiError.notFound(`Route not found — ${req.method} ${req.originalUrl}`));
};
