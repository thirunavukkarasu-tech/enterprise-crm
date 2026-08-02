import mongoose from 'mongoose';
import { CUSTOMER_STATUSES } from '../utils/enums.js';

/**
 * Minimal-but-real Customer schema. The Dashboard module (Phase 3) needs a
 * genuine collection to aggregate over rather than mocked numbers; the full
 * Customer Management module (CRUD UI, profile page, filters) is a later
 * phase, but the persistence contract is established here so it doesn't
 * change out from under the dashboard queries built against it.
 */
const customerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, trim: true },
    company: { type: String, trim: true, maxlength: 120 },
    status: { type: String, enum: CUSTOMER_STATUSES, default: 'active' },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  },
  { timestamps: true }
);

customerSchema.index({ createdAt: -1 });
customerSchema.index({ status: 1 });

export const Customer = mongoose.model('Customer', customerSchema);
