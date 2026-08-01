import mongoose from 'mongoose';
import { ALL_ROLES, ROLES } from '../utils/roles.js';

/**
 * Placeholder schema so config/middleware wiring (auth guard, RBAC) has a
 * concrete model to compile against during Phase 1. Full implementation —
 * password hashing hooks, reset-token fields, comparePassword method,
 * indexes — is delivered in Phase 2 (Authentication module).
 */
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ALL_ROLES, default: ROLES.SALES_EXECUTIVE },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const User = mongoose.model('User', userSchema);
