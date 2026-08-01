import crypto from 'crypto';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ALL_ROLES, ROLES } from '../utils/roles.js';
import { env } from '../config/env.js';
import { hashToken } from '../utils/hashToken.js';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [80, 'Name cannot exceed 80 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Enter a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // never returned by default on find queries
    },
    role: {
      type: String,
      enum: { values: ALL_ROLES, message: `Role must be one of: ${ALL_ROLES.join(', ')}` },
      default: ROLES.EMPLOYEE,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLoginAt: {
      type: Date,
    },
    passwordChangedAt: {
      type: Date,
      select: false,
    },

    // --- Refresh token (single active session, rotated on every refresh) ---
    // A hash (not the raw token) is stored so a leaked DB dump can't be used
    // to forge sessions — mirrors how passwords are stored. Storing a single
    // token (rather than an array) is a deliberate Phase-2 simplification;
    // multi-device session support would extend this to an array of
    // { tokenHash, userAgent, createdAt } documents.
    refreshTokenHash: {
      type: String,
      select: false,
    },

    // --- Forgot / reset password ---
    passwordResetToken: {
      type: String,
      select: false,
    },
    passwordResetExpires: {
      type: Date,
      select: false,
    },
  },
  { timestamps: true }
);

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password, env.bcryptSaltRounds);

  // Only relevant when an existing user changes their password (not on
  // initial creation) — used by the auth middleware to invalidate JWTs
  // issued before this change.
  if (!this.isNew) {
    this.passwordChangedAt = new Date(Date.now() - 1000); // -1s clock-skew buffer
  }
  next();
});

// ---------------------------------------------------------------------------
// Instance methods
// ---------------------------------------------------------------------------

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.generateAccessToken = function generateAccessToken() {
  return jwt.sign({ sub: this._id.toString(), role: this.role }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });
};

userSchema.methods.generateRefreshToken = function generateRefreshToken() {
  return jwt.sign({ sub: this._id.toString() }, env.jwtRefreshSecret, {
    expiresIn: env.jwtRefreshExpiresIn,
  });
};

/** True if the password was changed after the given JWT `iat` (seconds). */
userSchema.methods.changedPasswordAfter = function changedPasswordAfter(jwtIat) {
  if (!this.passwordChangedAt) return false;
  const changedAtSeconds = Math.floor(this.passwordChangedAt.getTime() / 1000);
  return jwtIat < changedAtSeconds;
};

/**
 * Generates a one-time password-reset token. Returns the *raw* token (sent
 * to the user via email) while persisting only its SHA-256 hash — the same
 * pattern used for the refresh token, so a DB leak never exposes a usable
 * credential.
 */
userSchema.methods.createPasswordResetToken = function createPasswordResetToken() {
  const rawToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = hashToken(rawToken);
  this.passwordResetExpires = new Date(Date.now() + env.resetTokenExpiresMinutes * 60 * 1000);
  return rawToken;
};

export const User = mongoose.model('User', userSchema);
