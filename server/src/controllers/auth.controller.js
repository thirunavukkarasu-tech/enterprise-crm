import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { hashToken } from '../utils/hashToken.js';
import { sendPasswordResetEmail } from '../utils/email.js';
import { env } from '../config/env.js';

const REFRESH_COOKIE_NAME = 'refreshToken';

/**
 * Cookie options for the refresh token. `httpOnly` keeps it invisible to
 * client-side JS (mitigates XSS token theft); `secure` is enabled outside
 * dev so it's only ever sent over HTTPS; `sameSite: 'strict'` mitigates CSRF
 * since the cookie is never sent on cross-site requests.
 */
const refreshCookieOptions = () => ({
  httpOnly: true,
  secure: env.isProd,
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days — kept in sync with JWT_REFRESH_EXPIRES_IN default
  path: '/api/v1/auth', // only sent to auth endpoints, not the whole API surface
});

const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  lastLoginAt: user.lastLoginAt,
});

/** Issues a fresh access + refresh token pair, persists the refresh hash, and sets the cookie. */
const issueSession = async (user, res) => {
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  user.refreshTokenHash = hashToken(refreshToken);
  await user.save({ validateBeforeSave: false });

  res.cookie(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions());
  return accessToken;
};

// POST /api/v1/auth/login
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  if (!user.isActive) {
    throw ApiError.forbidden('This account has been deactivated. Contact your administrator.');
  }

  const accessToken = await issueSession(user, res);
  user.lastLoginAt = new Date();
  await user.save({ validateBeforeSave: false });

  new ApiResponse(200, { accessToken, user: sanitizeUser(user) }, 'Logged in successfully').send(res);
});

// POST /api/v1/auth/refresh-token
export const refreshToken = asyncHandler(async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE_NAME];
  if (!token) {
    throw ApiError.unauthorized('No refresh token provided');
  }

  let decoded;
  try {
    decoded = jwt.verify(token, env.jwtRefreshSecret);
  } catch (err) {
    res.clearCookie(REFRESH_COOKIE_NAME, refreshCookieOptions());
    throw ApiError.unauthorized('Refresh session expired — please log in again');
  }

  const user = await User.findById(decoded.sub).select('+refreshTokenHash');

  // If the presented token's hash doesn't match what's on file, either the
  // session was already rotated/logged-out elsewhere, or this is a replayed/
  // stolen token. Either way: reject and force a fresh login rather than
  // silently trusting it.
  if (!user || !user.isActive || user.refreshTokenHash !== hashToken(token)) {
    if (user) {
      user.refreshTokenHash = undefined;
      await user.save({ validateBeforeSave: false });
    }
    res.clearCookie(REFRESH_COOKIE_NAME, refreshCookieOptions());
    throw ApiError.unauthorized('Session is no longer valid — please log in again');
  }

  const accessToken = await issueSession(user, res); // rotates the refresh token too

  new ApiResponse(200, { accessToken, user: sanitizeUser(user) }, 'Session refreshed').send(res);
});

// POST /api/v1/auth/logout
export const logout = asyncHandler(async (req, res) => {
  const token = req.cookies?.[REFRESH_COOKIE_NAME];

  if (token) {
    try {
      const decoded = jwt.verify(token, env.jwtRefreshSecret);
      await User.findByIdAndUpdate(decoded.sub, { $unset: { refreshTokenHash: 1 } });
    } catch (err) {
      // Token already invalid/expired — nothing to revoke server-side, still clear the cookie.
    }
  }

  res.clearCookie(REFRESH_COOKIE_NAME, refreshCookieOptions());
  new ApiResponse(200, null, 'Logged out successfully').send(res);
});

// GET /api/v1/auth/me
export const getMe = asyncHandler(async (req, res) => {
  new ApiResponse(200, { user: sanitizeUser(req.user) }, 'Current user fetched').send(res);
});

// POST /api/v1/auth/forgot-password
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  // Always respond with the same generic message whether or not the email
  // exists — prevents user enumeration via response timing/content.
  const genericMessage = 'If an account exists for that email, a reset link has been sent.';

  if (user && user.isActive) {
    const rawToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${env.clientUrl}/reset-password/${rawToken}`;
    await sendPasswordResetEmail({ to: user.email, resetUrl });
  }

  new ApiResponse(200, null, genericMessage).send(res);
});

// POST /api/v1/auth/reset-password/:token
export const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  const user = await User.findOne({
    passwordResetToken: hashToken(token),
    passwordResetExpires: { $gt: new Date() },
  }).select('+passwordResetToken +passwordResetExpires');

  if (!user) {
    throw ApiError.badRequest('This reset link is invalid or has expired');
  }

  user.password = password; // re-hashed by the pre('save') hook
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  user.refreshTokenHash = undefined; // revoke any existing session on password reset
  await user.save();

  new ApiResponse(200, null, 'Password reset successfully. Please log in with your new password.').send(res);
});
