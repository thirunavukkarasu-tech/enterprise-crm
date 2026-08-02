import mongoose from 'mongoose';
import { OPPORTUNITY_STAGES } from '../utils/enums.js';

const opportunitySchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 150 },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    amount: { type: Number, required: true, min: 0 },
    stage: { type: String, enum: OPPORTUNITY_STAGES, default: 'prospecting', index: true },
    probability: { type: Number, min: 0, max: 100, default: 20 },
    expectedCloseDate: { type: Date },
    closedAt: { type: Date }, // set when stage transitions to closed_won / closed_lost
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  },
  { timestamps: true }
);

opportunitySchema.index({ createdAt: -1 });
opportunitySchema.index({ stage: 1, closedAt: -1 });

export const Opportunity = mongoose.model('Opportunity', opportunitySchema);
