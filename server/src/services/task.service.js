import fs from 'fs';
import path from 'path';
import { Task } from '../models/Task.js';
import { Activity } from '../models/Activity.js';
import { ApiError } from '../utils/ApiError.js';
import { ROLES } from '../utils/roles.js';
import { notifyUser } from './notification.service.js';

const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Employees may only read/modify tasks assigned to them. */
const assertAccess = (user, task) => {
  if (user.role === ROLES.EMPLOYEE && !task.assignedTo.equals(user._id)) {
    throw ApiError.forbidden('You do not have access to this task');
  }
};

const logActivity = (type, description, user, taskId, metadata) =>
  Activity.create({ type, description, actor: user._id, relatedTask: taskId, metadata });

// ---------------------------------------------------------------------------
// List (server-side pagination, search, filters, sort)
// ---------------------------------------------------------------------------

export const listTasks = async (user, query) => {
  const page = query.page || 1;
  const limit = query.limit || 10;
  const sortBy = query.sortBy || 'dueDate';
  const sortOrder = query.sortOrder === 'desc' ? -1 : 1;

  const filter = { isDeleted: false };

  if (user.role === ROLES.EMPLOYEE) {
    filter.assignedTo = user._id;
  } else if (query.assignedTo) {
    filter.assignedTo = query.assignedTo;
  }

  if (query.status) filter.status = query.status;
  if (query.priority) filter.priority = query.priority;
  if (query.category) filter.category = query.category;
  if (query.relatedCustomer) filter.relatedCustomer = query.relatedCustomer;
  if (query.relatedLead) filter.relatedLead = query.relatedLead;

  if (query.dueFrom || query.dueTo) {
    filter.dueDate = {};
    if (query.dueFrom) filter.dueDate.$gte = new Date(query.dueFrom);
    if (query.dueTo) filter.dueDate.$lte = new Date(query.dueTo);
  }

  if (query.q) {
    const regex = new RegExp(escapeRegex(query.q), 'i');
    filter.$or = [{ title: regex }, { description: regex }];
  }

  const [items, total] = await Promise.all([
    Task.find(filter)
      .sort({ [sortBy]: sortOrder })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('assignedTo', 'name email role')
      .populate('relatedCustomer', 'name company')
      .populate('relatedLead', 'name company')
      .select('-attachments -comments')
      .lean(),
    Task.countDocuments(filter),
  ]);

  return {
    items,
    meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
  };
};

// ---------------------------------------------------------------------------
// Read one
// ---------------------------------------------------------------------------

export const getTaskById = async (user, id) => {
  const task = await Task.findOne({ _id: id, isDeleted: false })
    .populate('assignedTo', 'name email role')
    .populate('relatedCustomer', 'name company')
    .populate('relatedLead', 'name company')
    .populate('comments.createdBy', 'name role')
    .populate('attachments.uploadedBy', 'name role');

  if (!task) throw ApiError.notFound('Task not found');
  assertAccess(user, task);
  return task;
};

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------

export const createTask = async (user, payload) => {
  const assignedTo = user.role !== ROLES.EMPLOYEE && payload.assignedTo ? payload.assignedTo : user._id;

  const task = await Task.create({ ...payload, assignedTo });

  if (assignedTo.toString() !== user._id.toString()) {
    await notifyUser(assignedTo, {
      type: 'task',
      title: 'New task assigned to you',
      message: `${user.name} assigned you "${task.title}"`,
    });
  }

  await logActivity('task_created', `${user.name} created task "${task.title}"`, user, task._id);

  return task;
};

// ---------------------------------------------------------------------------
// Update
// ---------------------------------------------------------------------------

export const updateTask = async (user, id, payload) => {
  const task = await Task.findOne({ _id: id, isDeleted: false });
  if (!task) throw ApiError.notFound('Task not found');
  assertAccess(user, task);

  if (payload.assignedTo && user.role === ROLES.EMPLOYEE) {
    delete payload.assignedTo;
  }

  const previousStatus = task.status;
  const previousAssignee = task.assignedTo?.toString();

  Object.assign(task, payload);

  // A reminder that's been edited to a new time should fire again.
  if (payload.reminderAt) {
    task.reminderSent = false;
  }

  await task.save();

  if (payload.status && payload.status !== previousStatus) {
    await logActivity(
      payload.status === 'completed' ? 'task_completed' : 'task_status_changed',
      `${user.name} changed "${task.title}"'s status to ${task.status}`,
      user,
      task._id,
      { from: previousStatus, to: task.status }
    );
  } else if (payload.assignedTo && payload.assignedTo !== previousAssignee) {
    await logActivity('task_assigned', `${user.name} reassigned "${task.title}"`, user, task._id);
    if (payload.assignedTo !== user._id.toString()) {
      await notifyUser(payload.assignedTo, {
        type: 'task',
        title: 'Task assigned to you',
        message: `${user.name} assigned you "${task.title}"`,
      });
    }
  } else {
    await logActivity('task_updated', `${user.name} updated "${task.title}"`, user, task._id);
  }

  return task;
};

// ---------------------------------------------------------------------------
// Soft delete
// ---------------------------------------------------------------------------

export const deleteTask = async (user, id) => {
  const task = await Task.findOne({ _id: id, isDeleted: false });
  if (!task) throw ApiError.notFound('Task not found');
  assertAccess(user, task);

  task.isDeleted = true;
  task.deletedAt = new Date();
  await task.save();

  await logActivity('task_deleted', `${user.name} deleted task "${task.title}"`, user, task._id);
};

// ---------------------------------------------------------------------------
// Comments
// ---------------------------------------------------------------------------

export const addComment = async (user, id, text) => {
  const task = await Task.findOne({ _id: id, isDeleted: false });
  if (!task) throw ApiError.notFound('Task not found');
  assertAccess(user, task);

  task.comments.push({ text, createdBy: user._id });
  await task.save();
  await task.populate('comments.createdBy', 'name role');

  await logActivity('task_comment_added', `${user.name} commented on "${task.title}"`, user, task._id);

  return task.comments[task.comments.length - 1];
};

// ---------------------------------------------------------------------------
// Attachments
// ---------------------------------------------------------------------------

export const addAttachment = async (user, id, file) => {
  const task = await Task.findOne({ _id: id, isDeleted: false });
  if (!task) throw ApiError.notFound('Task not found');
  assertAccess(user, task);

  const attachment = {
    fileName: file.filename,
    originalName: file.originalname,
    mimeType: file.mimetype,
    size: file.size,
    url: `/uploads/tasks/${file.filename}`,
    uploadedBy: user._id,
  };

  task.attachments.push(attachment);
  await task.save();
  await task.populate('attachments.uploadedBy', 'name role');

  await logActivity(
    'task_attachment_added',
    `${user.name} attached "${file.originalname}" to "${task.title}"`,
    user,
    task._id
  );

  return task.attachments[task.attachments.length - 1];
};

export const removeAttachment = async (user, id, attachmentId) => {
  const task = await Task.findOne({ _id: id, isDeleted: false });
  if (!task) throw ApiError.notFound('Task not found');
  assertAccess(user, task);

  const attachment = task.attachments.id(attachmentId);
  if (!attachment) throw ApiError.notFound('Attachment not found');

  const filePath = path.join(process.cwd(), 'uploads', 'tasks', attachment.fileName);
  fs.unlink(filePath, () => {});

  attachment.deleteOne();
  await task.save();
};

// ---------------------------------------------------------------------------
// Timeline
// ---------------------------------------------------------------------------

export const getTaskTimeline = async (user, id, limit = 20) => {
  const task = await Task.findOne({ _id: id, isDeleted: false });
  if (!task) throw ApiError.notFound('Task not found');
  assertAccess(user, task);

  return Activity.find({ relatedTask: id })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('actor', 'name role')
    .lean();
};
