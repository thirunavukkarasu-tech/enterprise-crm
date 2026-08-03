import mongoose from 'mongoose';
import { LEAD_STATUSES, LEAD_SOURCES, LEAD_PRIORITIES } from '../utils/enums.js';

// Reuses the same embedded-note pattern as Customer (see server/src/models/Customer.js) —
// always read alongside the parent lead, never queried independently.
const noteSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, trim: true, maxlength: 2000 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true, _id: true }
);

/**
 * Files are stored on local disk (see server/src/middleware/upload.js) and
 * only the resulting metadata is embedded here — the same shape a cloud
 * storage integration (S3, GCS) would populate, so swapping the storage
 * backend later only touches the upload middleware, not this schema or
 * anything that reads `attachments`.
 */
const attachmentSchema = new mongoose.Schema(
  {
    fileName: { type: String, required: true }, // stored (randomized) filename on disk
    originalName: { type: String, required: true }, // name to show the user
    mimeType: { type: String, required: true },
    size: { type: Number, required: true }, // bytes
    url: { type: String, required: true }, // public path, e.g. /uploads/leads/<fileName>
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true, _id: true }
);

const leadSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Enter a valid email address'],
    },
    phone: { type: String, trim: true, maxlength: 30 },
    company: { type: String, trim: true, maxlength: 120 },
    status: { type: String, enum: LEAD_STATUSES, default: 'new' },
    source: { type: String, enum: LEAD_SOURCES, default: 'other' },
    priority: { type: String, enum: LEAD_PRIORITIES, default: 'medium' },
    estimatedValue: { type: Number, default: 0, min: 0 },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    notes: { type: [noteSchema], default: [] },
    attachments: { type: [attachmentSchema], default: [] },

    // --- Conversion (Lead → Customer) -----------------------------------------
    // A lead is never "deleted" or mutated into a Customer document — a new
    // Customer is created and the Lead keeps a permanent pointer to it, so
    // the original lead source/history remains intact for reporting (e.g.
    // "conversion rate by source" needs the original Lead record to still
    // exist after conversion).
    convertedToCustomer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    convertedAt: { type: Date },

    // --- Soft delete -------------------------------------------------------
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

// --- Indexes -----------------------------------------------------------------
// Covers "my active leads, newest first" (and the org-wide equivalent) in a
// single index scan — the dominant query shape for the list page.
leadSchema.index({ assignedTo: 1, isDeleted: 1, createdAt: -1 });
leadSchema.index({ status: 1, isDeleted: 1 });
leadSchema.index({ source: 1 });
leadSchema.index({ priority: 1 });
leadSchema.index({ createdAt: -1 });
leadSchema.index({ name: 'text', company: 'text', email: 'text' });

export const Lead = mongoose.model('Lead', leadSchema);
