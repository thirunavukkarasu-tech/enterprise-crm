import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';

/**
 * Global API rate limiter. Applied broadly in app.js; a stricter, dedicated
 * limiter is layered on top of the /auth/login and /auth/forgot-password
 * routes in Phase 2 to slow down credential-stuffing / brute force attempts.
 */
export const apiLimiter = rateLimit({
  windowMs: env.rateLimit.windowMinutes * 60 * 1000,
  max: env.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests — please try again later.',
  },
});
