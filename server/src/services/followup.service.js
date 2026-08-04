import { FollowUp } from '../models/FollowUp.js';
import { Activity } from '../models/Activity.js';
import { ApiError } from '../utils/ApiError.js';
import { ROLES } from '../utils/roles.js';

const assertAccess = (user, followUp) => {
  if (user.role === ROLES.EMPLOYEE && !followUp.assignedTo.equals(user._id)) {
    throw ApiError.forbidden('You do not have access to this follow-up');
  }
};

const logActivity = (type, description, user, followUp, metadata) =>
  Activity.create({
    type,
    description,
    actor: user._id,
    relatedFollowUp: followUp._id,
    relatedCustomer: followUp.relatedCustomer,
    metadata,
  });

// ---------------------------------------------------------------------------
// List (server-side pagination, filters, sort)
// ---------------------------------------------------------------------------

export const listFollowUps = async (user, query) => {
  const page = query.page || 1;
  const limit = query.limit || 10;
  const sortBy = query.sortBy || 'scheduledAt';
  const sortOrder = query.sortOrder === 'desc' ? -1 : 1;

  const filter = { isDeleted: false };

  if (user.role === ROLES.EMPLOYEE) {
    filter.assignedTo = user._id;
  } else if (query.assignedTo) {
    filter.assignedTo = query.assignedTo;
  }

  if (query.type) filter.type = query.type;
  if (query.status) filter.status = query.status;
  if (query.relatedCustomer) filter.relatedCustomer = query.relatedCustomer;

  if (query.dateFrom || query.dateTo) {
    filter.scheduledAt = {};
    if (query.dateFrom) filter.scheduledAt.$gte = new Date(query.dateFrom);
    if (query.dateTo) filter.scheduledAt.$lte = new Date(query.dateTo);
  }

  if (query.q) {
    filter.subject = new RegExp(query.q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  }

  const [items, total] = await Promise.all([
    FollowUp.find(filter)
      .sort({ [sortBy]: sortOrder })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('assignedTo', 'name email role')
      .populate('relatedCustomer', 'name company')
      .populate('relatedLead', 'name company')
      .lean(),
    FollowUp.countDocuments(filter),
  ]);

  return {
    items,
    meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
  };
};

// ---------------------------------------------------------------------------
// Read one
// ---------------------------------------------------------------------------

export const getFollowUpById = async (user, id) => {
  const followUp = await FollowUp.findOne({ _id: id, isDeleted: false })
    .populate('assignedTo', 'name email role')
    .populate('relatedCustomer', 'name company')
    .populate('relatedLead', 'name company');

  if (!followUp) throw ApiError.notFound('Follow-up not found');
  assertAccess(user, followUp);
  return followUp;
};

// ---------------------------------------------------------------------------
// Customer interaction history — every follow-up for one customer, newest first
// ---------------------------------------------------------------------------

export const getFollowUpsForCustomer = async (user, customerId, limit = 20) => {
  const filter = { relatedCustomer: customerId, isDeleted: false };
  if (user.role === ROLES.EMPLOYEE) filter.assignedTo = user._id;

  return FollowUp.find(filter)
    .sort({ scheduledAt: -1 })
    .limit(limit)
    .populate('assignedTo', 'name role')
    .lean();
};

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------

export const createFollowUp = async (user, payload) => {
  const assignedTo = user.role !== ROLES.EMPLOYEE && payload.assignedTo ? payload.assignedTo : user._id;

  const followUp = await FollowUp.create({ ...payload, assignedTo });

  const typeLabel = { call: 'call', meeting: 'meeting', email: 'email follow-up' }[followUp.type];
  await logActivity(
    'followup_scheduled',
    `${user.name} scheduled a ${typeLabel}: "${followUp.subject}"`,
    user,
    followUp
  );

  return followUp;
};

// ---------------------------------------------------------------------------
// Update
// ---------------------------------------------------------------------------

export const updateFollowUp = async (user, id, payload) => {
  const followUp = await FollowUp.findOne({ _id: id, isDeleted: false });
  if (!followUp) throw ApiError.notFound('Follow-up not found');
  assertAccess(user, followUp);

  if (payload.assignedTo && user.role === ROLES.EMPLOYEE) {
    delete payload.assignedTo;
  }

  const previousStatus = followUp.status;
  Object.assign(followUp, payload);

  if (payload.reminderAt) {
    followUp.reminderSent = false;
  }

  await followUp.save();

  if (payload.status && payload.status !== previousStatus) {
    const activityType =
      { completed: 'followup_completed', cancelled: 'followup_cancelled' }[payload.status] ||
      'followup_updated';
    await logActivity(
      activityType,
      `${user.name} marked "${followUp.subject}" as ${payload.status.replace('_', ' ')}`,
      user,
      followUp,
      { from: previousStatus, to: followUp.status }
    );
  } else {
    await logActivity('followup_updated', `${user.name} updated "${followUp.subject}"`, user, followUp);
  }

  return followUp;
};

// ---------------------------------------------------------------------------
// Soft delete
// ---------------------------------------------------------------------------

export const deleteFollowUp = async (user, id) => {
  const followUp = await FollowUp.findOne({ _id: id, isDeleted: false });
  if (!followUp) throw ApiError.notFound('Follow-up not found');
  assertAccess(user, followUp);

  followUp.isDeleted = true;
  followUp.deletedAt = new Date();
  await followUp.save();

  await logActivity('followup_cancelled', `${user.name} removed a scheduled ${followUp.type}`, user, followUp);
};
