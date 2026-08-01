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

/**
 * Stricter limiter for credential-sensitive endpoints (login, forgot
 * password). A much lower ceiling than the general API limiter to slow
 * down brute-force / credential-stuffing attempts specifically, without
 * penalizing normal browsing of the rest of the API.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: {
    success: false,
    message: 'Too many attempts — please wait a few minutes and try again.',
  },
});
