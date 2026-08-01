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

  const user = await User.findById(decoded.sub).select('+passwordChangedAt');
  if (!user || !user.isActive) {
    throw ApiError.unauthorized('Account is inactive or no longer exists');
  }

  // If the password was changed after this token was issued, the token is
  // stale even though it hasn't technically expired yet — reject it so a
  // stolen access token becomes useless the moment the user changes their
  // password.
  if (user.changedPasswordAfter(decoded.iat)) {
    throw ApiError.unauthorized('Password was recently changed — please log in again');
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
