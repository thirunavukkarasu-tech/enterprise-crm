import mongoose from 'mongoose';
import { AUDIT_ACTIONS } from '../utils/enums.js';

/**
 * Append-only audit trail. Two consumers read this same collection:
 * - Administration > Audit Logs: every action, all fields.
 * - Administration > Login History: filtered to `login_success`/
 *   `login_failed`, using `ip`/`userAgent`.
 * One collection instead of two, following the same "one log, multiple
 * views" pattern as the Activity model (see docs/ARCHITECTURE.md §7-9).
 */
const auditLogSchema = new mongoose.Schema(
  {
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
    actorEmail: { type: String, trim: true }, // preserved even for failed logins where actor may not resolve
    action: { type: String, enum: AUDIT_ACTIONS, required: true, index: true },
    targetType: { type: String, trim: true }, // e.g. 'User', 'CompanySettings'
    targetId: { type: mongoose.Schema.Types.ObjectId },
    description: { type: String, required: true, trim: true, maxlength: 300 },
    metadata: { type: mongoose.Schema.Types.Mixed },
    ip: { type: String, trim: true },
    userAgent: { type: String, trim: true },
  },
  { timestamps: true }
);

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ actor: 1, createdAt: -1 });

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);
