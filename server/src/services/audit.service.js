import { AuditLog } from '../models/AuditLog.js';

const LOGIN_ACTIONS = ['login_success', 'login_failed', 'logout'];

/**
 * Every audit-worthy event in the app is recorded through this one
 * function — mirroring `notifyUser` in notification.service.js. Audit
 * writes deliberately never throw: a failure to *record* that a user
 * logged in must never block the user from actually logging in. Errors
 * are logged server-side for operational visibility instead.
 */
export const logAudit = async ({
  actor,
  actorEmail,
  action,
  targetType,
  targetId,
  description,
  metadata,
  ip,
  userAgent,
}) => {
  try {
    await AuditLog.create({ actor, actorEmail, action, targetType, targetId, description, metadata, ip, userAgent });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[audit] Failed to write audit log:', err);
  }
};

const buildDateFilter = (from, to) => {
  if (!from && !to) return undefined;
  const filter = {};
  if (from) filter.$gte = new Date(from);
  if (to) filter.$lte = new Date(to);
  return filter;
};

/** Administration > Audit Logs — every recorded action, all fields. */
export const listAuditLogs = async ({ page = 1, limit = 25, action, actor, from, to }) => {
  const filter = {};
  if (action) filter.action = action;
  if (actor) filter.actor = actor;
  const createdAt = buildDateFilter(from, to);
  if (createdAt) filter.createdAt = createdAt;

  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    AuditLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('actor', 'name email role').lean(),
    AuditLog.countDocuments(filter),
  ]);

  return { items, meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 } };
};

/**
 * Administration > Login History — the same collection as Audit Logs,
 * pre-filtered to authentication events. See docs/API_ADMIN.md for why
 * this is a view over one collection rather than a separate one.
 */
export const listLoginHistory = async ({ page = 1, limit = 25, actor, from, to }) => {
  const filter = { action: { $in: LOGIN_ACTIONS } };
  if (actor) filter.actor = actor;
  const createdAt = buildDateFilter(from, to);
  if (createdAt) filter.createdAt = createdAt;

  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    AuditLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('actor', 'name email role').lean(),
    AuditLog.countDocuments(filter),
  ]);

  return { items, meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 } };
};
