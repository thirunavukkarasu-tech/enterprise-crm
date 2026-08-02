import mongoose from 'mongoose';
import { LEAD_STATUSES, LEAD_SOURCES } from '../utils/enums.js';

const leadSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, trim: true, lowercase: true },
    company: { type: String, trim: true, maxlength: 120 },
    status: { type: String, enum: LEAD_STATUSES, default: 'new', index: true },
    source: { type: String, enum: LEAD_SOURCES, default: 'other' },
    estimatedValue: { type: Number, default: 0, min: 0 },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  },
  { timestamps: true }
);

leadSchema.index({ createdAt: -1 });

export const Lead = mongoose.model('Lead', leadSchema);
