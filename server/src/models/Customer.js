import mongoose from 'mongoose';
import { CUSTOMER_STATUSES } from '../utils/enums.js';

/**
 * Notes are embedded rather than a separate collection: they're always read
 * and displayed alongside their parent customer (the Customer Details
 * page), are never queried independently across customers, and stay small
 * in number per customer — embedding avoids an extra round-trip/populate
 * for a data shape that's fundamentally "part of" the customer document.
 */
const noteSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, trim: true, maxlength: 2000 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true, _id: true }
);

const customerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Enter a valid email address'],
    },
    phone: { type: String, trim: true, maxlength: 30 },
    company: { type: String, trim: true, maxlength: 120 },
    industry: { type: String, trim: true, maxlength: 80 },
    address: { type: String, trim: true, maxlength: 240 },
    status: { type: String, enum: CUSTOMER_STATUSES, default: 'lead' },
    tags: {
      type: [String],
      default: [],
      set: (tags) => [...new Set(tags.map((t) => t.trim().toLowerCase()).filter(Boolean))],
    },
    notes: { type: [noteSchema], default: [] },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    // --- Soft delete -------------------------------------------------------
    // Customers are never hard-deleted: they're referenced by Opportunities,
    // Tasks, and Activity history, so removing the row would orphan those
    // records or silently corrupt reports. `isDeleted` is filtered out of
    // every read path in the service layer instead.
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

// --- Indexes -----------------------------------------------------------------
// Unique email, but only among *active* (non-deleted) customers — a
// partial index rather than a plain unique index, so a soft-deleted
// customer's email doesn't permanently block re-adding that contact.
customerSchema.index(
  { email: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);

// Supports the common "list all my active customers, newest first" query
// (assignedTo + isDeleted equality, createdAt sort) as a single index scan.
customerSchema.index({ assignedTo: 1, isDeleted: 1, createdAt: -1 });

// Supports filtering by status/tag from the list page without a collection scan.
customerSchema.index({ status: 1, isDeleted: 1 });
customerSchema.index({ tags: 1 });

// Text index powers the free-text search box (name/company/email). Regex
// `$or` search (see customer.service.js) is used instead for short partial
// queries since MongoDB text search only matches whole words — at this
// dataset scale a regex scan is fast enough; a production deployment at
// much larger scale would move search to Atlas Search/Elasticsearch instead
// of scaling this index further.
customerSchema.index({ name: 'text', company: 'text', email: 'text' });

export const Customer = mongoose.model('Customer', customerSchema);
