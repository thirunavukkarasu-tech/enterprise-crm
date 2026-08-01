import jwt from 'jsonwebtoken';
import { asyncHandler } from './asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { env } from '../config/env.js';
import { User } from '../models/User.js';

/**
 * Verifies the Bearer JWT and attaches the authenticated user to req.user.
 * Re-fetches the user from the DB (rather than trusting the token payload
 * alone) so a deactivated/deleted/demoted account is rejected immediately —
 * see docs/ARCHITECTURE.md §4.
 */
export const protect = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw ApiError.unauthorized('Not authenticated — missing or malformed token');
  }

  const token = authHeader.split(' ')[1];

  let decoded;
  try {
    decoded = jwt.verify(token, env.jwtSecret);
  } catch (err) {
    throw err; // normalized by errorHandler (JsonWebTokenError / TokenExpiredError)
  }

  const user = await User.findById(decoded.sub).select('-password');
  if (!user || !user.isActive) {
    throw ApiError.unauthorized('Account is inactive or no longer exists');
  }

  req.user = user;
  next();
});

/**
 * Role-based access guard. Usage: authorize('admin', 'manager')
 * Must run after `protect`.
 */
export const authorize =
  (...allowedRoles) =>
  (req, res, next) => {
    if (!req.user) {
      throw ApiError.unauthorized('Not authenticated');
    }
    if (!allowedRoles.includes(req.user.role)) {
      throw ApiError.forbidden('You do not have permission to perform this action');
    }
    next();
  };
