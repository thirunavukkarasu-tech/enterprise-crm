import mongoose from 'mongoose';
import { ACTIVITY_TYPES } from '../utils/enums.js';

/**
 * Append-only activity log. Rather than reconstructing "recent activity"
 * by querying and merging multiple collections (Customers, Leads, Tasks...)
 * on every dashboard load, each module writes one Activity record when a
 * notable event happens. This keeps the timeline query a single cheap
 * `find().sort().limit()` regardless of how many domain modules exist.
 */
const activitySchema = new mongoose.Schema(
  {
    type: { type: String, enum: ACTIVITY_TYPES, required: true },
    description: { type: String, required: true, trim: true, maxlength: 300 },
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    relatedCustomer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', index: true },
    relatedLead: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', index: true },
    metadata: { type: mongoose.Schema.Types.Mixed }, // e.g. { leadId, amount }
  },
  { timestamps: true }
);

activitySchema.index({ createdAt: -1 });
activitySchema.index({ relatedCustomer: 1, createdAt: -1 });
activitySchema.index({ relatedLead: 1, createdAt: -1 });

export const Activity = mongoose.model('Activity', activitySchema);
