import mongoose from 'mongoose';
import { TASK_STATUSES, TASK_PRIORITIES, TASK_CATEGORIES } from '../utils/enums.js';

// Same embedded-comment pattern as Customer/Lead notes — always read
// alongside their parent task, never queried independently.
const commentSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, trim: true, maxlength: 2000 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true, _id: true }
);

// Same generic, storage-agnostic shape as Lead attachments (see
// server/src/models/Lead.js and server/src/middleware/upload.js).
const attachmentSchema = new mongoose.Schema(
  {
    fileName: { type: String, required: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    url: { type: String, required: true },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true, _id: true }
);

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 150 },
    description: { type: String, trim: true, maxlength: 1000 },
    dueDate: { type: Date, required: true, index: true },
    priority: { type: String, enum: TASK_PRIORITIES, default: 'medium' },
    status: { type: String, enum: TASK_STATUSES, default: 'pending', index: true },
    category: { type: String, enum: TASK_CATEGORIES, default: 'other' },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    relatedCustomer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    relatedLead: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead' },

    comments: { type: [commentSchema], default: [] },
    attachments: { type: [attachmentSchema], default: [] },

    // --- Reminders -----------------------------------------------------------
    // `reminderSent` is flipped by the reminder sweep job (see
    // server/src/jobs/reminderSweep.js) once a Notification has been created
    // for it, so the same due reminder is never notified twice.
    reminderAt: { type: Date },
    reminderSent: { type: Boolean, default: false },

    // --- Soft delete -------------------------------------------------------
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

// Covers "my open tasks, soonest due first" — the dominant query shape for
// both the list page and the dashboard's "Upcoming Tasks" widget.
taskSchema.index({ assignedTo: 1, isDeleted: 1, dueDate: 1 });
taskSchema.index({ status: 1, isDeleted: 1 });
taskSchema.index({ priority: 1 });
taskSchema.index({ category: 1 });
// Sweep query: "reminders due, not yet sent" across all tasks.
taskSchema.index({ reminderAt: 1, reminderSent: 1 });
taskSchema.index({ title: 'text' });

export const Task = mongoose.model('Task', taskSchema);
