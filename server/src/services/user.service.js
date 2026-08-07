import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { logAudit } from './audit.service.js';
import { notifyUser } from './notification.service.js';

/**
 * Powers the "assign to" pickers on Tasks/Leads/Customers/Follow-ups.
 * Deliberately minimal — returns just enough to populate a dropdown.
 */
export const listAssignableUsers = async () =>
  User.find({ isActive: true }).select('name email role').sort({ name: 1 }).lean();

// ---------------------------------------------------------------------------
// Self-service profile (GET/PATCH /users/me/*)
// ---------------------------------------------------------------------------

const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  isActive: user.isActive,
  avatarUrl: user.avatarUrl,
  phone: user.phone,
  jobTitle: user.jobTitle,
  preferences: user.preferences,
  lastLoginAt: user.lastLoginAt,
  createdAt: user.createdAt,
});

export const getProfile = async (user) => sanitizeUser(user);

export const updateProfile = async (user, { name, phone, jobTitle }) => {
  if (name !== undefined) user.name = name;
  if (phone !== undefined) user.phone = phone;
  if (jobTitle !== undefined) user.jobTitle = jobTitle;
  await user.save();
  return sanitizeUser(user);
};

export const updateAvatar = async (user, avatarUrl) => {
  user.avatarUrl = avatarUrl;
  await user.save();
  return sanitizeUser(user);
};

export const updatePreferences = async (user, { theme, emailNotifications }) => {
  if (theme !== undefined) user.preferences.theme = theme;
  if (emailNotifications !== undefined) {
    user.preferences.emailNotifications = { ...user.preferences.emailNotifications, ...emailNotifications };
  }
  await user.save();
  return sanitizeUser(user);
};

export const changePassword = async (user, { currentPassword, newPassword }, { ip, userAgent } = {}) => {
  const userWithPassword = await User.findById(user._id).select('+password');
  const isValid = await userWithPassword.comparePassword(currentPassword);
  if (!isValid) {
    throw ApiError.badRequest('Current password is incorrect');
  }

  userWithPassword.password = newPassword; // re-hashed by the pre('save') hook
  userWithPassword.refreshTokenHash = undefined; // force re-login on other sessions
  await userWithPassword.save();

  await logAudit({
    actor: user._id,
    actorEmail: user.email,
    action: 'password_changed',
    targetType: 'User',
    targetId: user._id,
    description: `${user.name} changed their password`,
    ip,
    userAgent,
  });

  await notifyUser(user._id, {
    type: 'security',
    title: 'Password changed',
    message: 'Your password was changed successfully. If this wasn\u2019t you, contact an administrator immediately.',
  });
};

// ---------------------------------------------------------------------------
// Administration > Manage Users (Admin only — enforced at the route layer)
// ---------------------------------------------------------------------------

export const listUsers = async ({ page = 1, limit = 20, q, role, isActive }) => {
  const filter = {};
  if (role) filter.role = role;
  if (isActive !== undefined) filter.isActive = isActive === 'true' || isActive === true;
  if (q) {
    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'i');
    filter.$or = [{ name: regex }, { email: regex }];
  }

  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    User.countDocuments(filter),
  ]);

  return {
    items: items.map(sanitizeUser),
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
  };
};

export const getUserById = async (id) => {
  const user = await User.findById(id);
  if (!user) throw ApiError.notFound('User not found');
  return sanitizeUser(user);
};

/**
 * Admin-provisioned account creation — there is no public registration
 * endpoint (see docs/ARCHITECTURE.md §4). The admin sets an initial
 * password directly rather than the app emailing a temporary one, keeping
 * this phase's scope free of a second email-delivery dependency; a
 * "require password change on first login" flag is a natural follow-up.
 */
export const createUser = async (actor, payload, { ip, userAgent } = {}) => {
  const existing = await User.findOne({ email: payload.email });
  if (existing) throw ApiError.conflict('A user with this email already exists');

  const user = await User.create(payload);

  await logAudit({
    actor: actor._id,
    actorEmail: actor.email,
    action: 'user_created',
    targetType: 'User',
    targetId: user._id,
    description: `${actor.name} created user ${user.name} (${user.role})`,
    ip,
    userAgent,
  });

  return sanitizeUser(user);
};

export const updateUser = async (actor, targetId, { name, role, isActive }, { ip, userAgent } = {}) => {
  if (targetId === actor._id.toString() && (role !== undefined || isActive === false)) {
    throw ApiError.forbidden('You cannot change your own role or deactivate your own account');
  }

  const user = await User.findById(targetId);
  if (!user) throw ApiError.notFound('User not found');

  const roleChanged = role !== undefined && role !== user.role;
  const statusChanged = isActive !== undefined && isActive !== user.isActive;

  if (name !== undefined) user.name = name;
  if (role !== undefined) user.role = role;
  if (isActive !== undefined) user.isActive = isActive;
  await user.save();

  if (roleChanged) {
    await logAudit({
      actor: actor._id,
      actorEmail: actor.email,
      action: 'user_role_changed',
      targetType: 'User',
      targetId: user._id,
      description: `${actor.name} changed ${user.name}'s role to ${role}`,
      ip,
      userAgent,
    });
    await notifyUser(user._id, {
      type: 'admin',
      title: 'Your role has changed',
      message: `Your account role is now ${role}.`,
    });
  }

  if (statusChanged) {
    await logAudit({
      actor: actor._id,
      actorEmail: actor.email,
      action: isActive ? 'user_activated' : 'user_deactivated',
      targetType: 'User',
      targetId: user._id,
      description: `${actor.name} ${isActive ? 'activated' : 'deactivated'} ${user.name}'s account`,
      ip,
      userAgent,
    });
  }

  if (!roleChanged && !statusChanged && name !== undefined) {
    await logAudit({
      actor: actor._id,
      actorEmail: actor.email,
      action: 'user_updated',
      targetType: 'User',
      targetId: user._id,
      description: `${actor.name} updated ${user.name}'s profile`,
      ip,
      userAgent,
    });
  }

  return sanitizeUser(user);
};
