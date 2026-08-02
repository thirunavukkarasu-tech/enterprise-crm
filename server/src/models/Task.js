import mongoose from 'mongoose';
import { TASK_STATUSES, TASK_PRIORITIES } from '../utils/enums.js';

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 150 },
    description: { type: String, trim: true, maxlength: 1000 },
    dueDate: { type: Date, required: true, index: true },
    priority: { type: String, enum: TASK_PRIORITIES, default: 'medium' },
    status: { type: String, enum: TASK_STATUSES, default: 'pending', index: true },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    relatedCustomer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    relatedLead: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead' },
  },
  { timestamps: true }
);

export const Task = mongoose.model('Task', taskSchema);
