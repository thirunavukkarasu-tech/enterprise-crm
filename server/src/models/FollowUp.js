import mongoose from 'mongoose';
import { FOLLOWUP_TYPES, FOLLOWUP_STATUSES } from '../utils/enums.js';

/**
 * A FollowUp is a single scheduled interaction (call/meeting/email) — the
 * building block behind "Customer Interaction History". Unlike Task
 * comments/notes (open-ended threads), a follow-up has exactly one `notes`
 * field describing what was discussed/planned, since it represents one
 * discrete event rather than an ongoing conversation.
 */
const followUpSchema = new mongoose.Schema(
  {
    type: { type: String, enum: FOLLOWUP_TYPES, required: true },
    subject: { type: String, required: true, trim: true, maxlength: 150 },
    notes: { type: String, trim: true, maxlength: 2000 },
    scheduledAt: { type: Date, required: true, index: true },
    durationMinutes: { type: Number, min: 0, max: 480 },
    status: { type: String, enum: FOLLOWUP_STATUSES, default: 'scheduled', index: true },

    // Every follow-up is tied to a customer (the interaction history it
    // powers is a customer-detail-page feature); the originating lead is
    // optional context for follow-ups scheduled before conversion.
    relatedCustomer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
    relatedLead: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead' },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    reminderAt: { type: Date },
    reminderSent: { type: Boolean, default: false },

    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

// Covers "my upcoming follow-ups, soonest first" and the customer
// interaction history query ("this customer's follow-ups, newest first").
followUpSchema.index({ assignedTo: 1, isDeleted: 1, scheduledAt: 1 });
followUpSchema.index({ relatedCustomer: 1, isDeleted: 1, scheduledAt: -1 });
followUpSchema.index({ reminderAt: 1, reminderSent: 1 });

export const FollowUp = mongoose.model('FollowUp', followUpSchema);
