import mongoose from 'mongoose';
import { NOTIFICATION_TYPES } from '../utils/enums.js';

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: NOTIFICATION_TYPES, default: 'system' },
    title: { type: String, required: true, trim: true, maxlength: 150 },
    message: { type: String, trim: true, maxlength: 300 },
    isRead: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, createdAt: -1 });

export const Notification = mongoose.model('Notification', notificationSchema);
