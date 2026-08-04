import { User } from '../models/User.js';

/**
 * Powers the "assign to" pickers on Tasks/Leads/Customers/Follow-ups.
 * Deliberately minimal — a full user-management module (create/deactivate/
 * change role) is Settings/Admin scope for a later phase. This only needs
 * to answer "who can I assign this to", so it returns active users' id,
 * name, and role and nothing else.
 */
export const listAssignableUsers = async () =>
  User.find({ isActive: true }).select('name email role').sort({ name: 1 }).lean();
